import logging
from datetime import datetime, timezone
from typing import Optional, Protocol, runtime_checkable

try:  # pragma: no cover - optional dependency guards
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from apscheduler.triggers.cron import CronTrigger
except Exception:  # pragma: no cover
    AsyncIOScheduler = None  # type: ignore
    CronTrigger = None  # type: ignore

from ..db import session_scope
from ..models import Job, JobRun, JobRunStatus, JobStatus
from .queue import JobQueue

logger = logging.getLogger(__name__)


@runtime_checkable
class Scheduler(Protocol):
    def start(self) -> None:
        ...

    def shutdown(self) -> None:
        ...

    def sync_job(self, job: Job) -> None:
        ...

    def remove_job(self, job_id: int) -> None:
        ...


class NullScheduler:
    """No-op scheduler used when APScheduler is unavailable or disabled."""

    def start(self) -> None:
        logger.info("Scheduler disabled")

    def shutdown(self) -> None:  # pragma: no cover - trivial
        logger.info("Scheduler shutdown noop")

    def sync_job(self, job: Job) -> None:
        logger.debug("Skipping schedule sync for job_id=%s", job.id)

    def remove_job(self, job_id: int) -> None:
        logger.debug("Skipping schedule removal for job_id=%s", job_id)


class APSchedulerAdapter:
    def __init__(self, queue: JobQueue, timezone: str = "UTC") -> None:
        if AsyncIOScheduler is None or CronTrigger is None:
            raise RuntimeError("APScheduler dependencies are not installed")

        self.queue = queue
        self.scheduler = AsyncIOScheduler(timezone=timezone)

    def start(self) -> None:
        if not self.scheduler.running:
            self.scheduler.start()
            self._load_existing_jobs()

    def shutdown(self) -> None:
        if self.scheduler.running:
            self.scheduler.shutdown(wait=False)

    def sync_job(self, job: Job) -> None:
        job_id = self._job_id(job.id)
        if not job.schedule_cron or job.status != JobStatus.active:
            self.remove_job(job.id)
            return

        trigger = CronTrigger.from_crontab(job.schedule_cron)
        self.scheduler.add_job(
            self._dispatch_job,
            trigger=trigger,
            id=job_id,
            replace_existing=True,
            kwargs={"job_id": job.id},
        )
        logger.info("Scheduled recurring run for job_id=%s", job.id)

    def remove_job(self, job_id: int) -> None:
        job_identifier = self._job_id(job_id)
        if self.scheduler.get_job(job_identifier):
            self.scheduler.remove_job(job_identifier)

    def _load_existing_jobs(self) -> None:
        with session_scope() as session:
            jobs = session.query(Job).filter(Job.schedule_cron.isnot(None)).all()
            for job in jobs:
                try:
                    self.sync_job(job)
                except Exception as exc:  # pragma: no cover - load failures
                    logger.error("Unable to schedule job_id=%s: %s", job.id, exc)

    def _dispatch_job(self, job_id: int) -> None:
        with session_scope() as session:
            job: Optional[Job] = session.get(Job, job_id)
            if not job:
                logger.warning("Scheduled job %s not found", job_id)
                return

            run = JobRun(
                job_id=job.id,
                status=JobRunStatus.queued,
                scheduled_for=datetime.now(timezone.utc),
                triggered_by="scheduler",
            )
            session.add(run)
            session.flush()

            message_id = self.queue.enqueue_job_run(job, run)
            run.queue_message_id = message_id
            session.add(run)
            logger.info(
                "Scheduled job run enqueued: job_id=%s run_id=%s message_id=%s",
                job.id,
                run.id,
                message_id,
            )

    @staticmethod
    def _job_id(job_id: int) -> str:
        return f"extract-job-{job_id}"
