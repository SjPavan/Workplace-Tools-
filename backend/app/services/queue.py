import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Protocol, runtime_checkable

from ..models import Job, JobRun

logger = logging.getLogger(__name__)


@runtime_checkable
class JobQueue(Protocol):
    """Interface for queue implementations consumed by the scraping worker."""

    def enqueue_job_run(self, job: Job, run: JobRun) -> str:
        """Publish a job run execution request to the queue and return a message ID."""


class RedisJobQueue:
    def __init__(self, redis_url: Optional[str], queue_name: str = "extract.jobs") -> None:
        self.redis_url = redis_url
        self.queue_name = queue_name
        self._client = None

        if redis_url:
            try:
                import redis

                self._client = redis.from_url(redis_url)
            except Exception as exc:  # pragma: no cover - defensive
                logger.warning("Unable to initialise Redis client: %s", exc)
                self._client = None

    def enqueue_job_run(self, job: Job, run: JobRun) -> str:
        payload = self._build_payload(job, run)
        message_id = payload["message_id"]

        if self._client is None:
            logger.info(
                "Redis not configured; skipping publish for job_run_id=%s", run.id
            )
            return message_id

        try:
            self._client.rpush(self.queue_name, json.dumps(payload))
        except Exception as exc:  # pragma: no cover - redis errors
            logger.error("Failed to enqueue job run %s: %s", run.id, exc)
            raise

        return message_id

    def _build_payload(self, job: Job, run: JobRun) -> Dict[str, Any]:
        message_id = f"msg_{uuid.uuid4()}"
        return {
            "message_id": message_id,
            "job_id": job.id,
            "job_run_id": run.id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "payload": {
                "target_urls": job.target_urls,
                "selectors": job.selectors,
                "scripts": job.scripts,
                "export_formats": job.export_formats,
            },
        }


class InMemoryJobQueue:
    """Simple in-memory queue used for local development and tests."""

    def __init__(self) -> None:
        self.messages: List[Dict[str, Any]] = []

    def enqueue_job_run(self, job: Job, run: JobRun) -> str:
        message_id = f"msg_{uuid.uuid4()}"
        payload = {
            "message_id": message_id,
            "job_id": job.id,
            "job_run_id": run.id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "payload": {
                "target_urls": job.target_urls,
                "selectors": job.selectors,
                "scripts": job.scripts,
                "export_formats": job.export_formats,
            },
        }
        self.messages.append(payload)
        return message_id
