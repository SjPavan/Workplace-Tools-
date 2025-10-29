from datetime import datetime, timedelta, timezone
from typing import List, Optional

from croniter import CroniterBadCronError, croniter
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from ..config import get_settings
from ..dependencies import (
    get_db,
    get_notification_bus,
    get_queue,
    get_scheduler,
    get_storage_service,
)
from ..models import Artifact, Job, JobRun, JobRunStatus, JobStatus
from ..schemas import (
    ArtifactRead,
    CreateRunResponse,
    JobCreate,
    JobDetail,
    JobRead,
    JobRunRead,
    PaginatedJobs,
    WorkerCallbackPayload,
)
from ..services.notifications import NotificationBus
from ..services.queue import JobQueue
from ..services.scheduler import Scheduler
from ..services.storage import StorageService

router = APIRouter(tags=["Extraction"])


def _validate_schedule(schedule: Optional[str]) -> Optional[str]:
    if not schedule:
        return None
    try:
        croniter(schedule)
    except (CroniterBadCronError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid cron expression: {exc}",
        )
    return schedule


def _validate_export_formats(formats: List[str]) -> List[str]:
    settings = get_settings()
    allowed = set(settings.allowed_export_formats)
    invalid = [fmt for fmt in formats if fmt not in allowed]
    if invalid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported export formats: {', '.join(invalid)}",
        )
    return formats


@router.post("/jobs", response_model=JobRead, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreate,
    session: Session = Depends(get_db),
    scheduler: Scheduler = Depends(get_scheduler),
):
    schedule = _validate_schedule(payload.schedule_cron)
    export_formats = _validate_export_formats(payload.export_formats)

    job = Job(
        name=payload.name,
        description=payload.description,
        target_urls=[str(url) for url in payload.target_urls],
        selectors=payload.selectors,
        scripts=payload.scripts,
        schedule_cron=schedule,
        export_formats=export_formats,
        status=payload.status,
    )
    session.add(job)
    session.commit()
    session.refresh(job)

    if schedule:
        scheduler.sync_job(job)

    return JobRead.from_orm(job)


@router.get("/jobs", response_model=PaginatedJobs)
def list_jobs(
    session: Session = Depends(get_db),
    status_filter: Optional[JobStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    query = session.query(Job)
    if status_filter:
        query = query.filter(Job.status == status_filter)

    total = query.count()
    jobs = (
        query.order_by(desc(Job.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return PaginatedJobs(
        items=[JobRead.from_orm(job) for job in jobs],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/jobs/{job_id}", response_model=JobDetail)
def get_job_detail(job_id: int, session: Session = Depends(get_db)):
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    runs = (
        session.query(JobRun)
        .filter(JobRun.job_id == job.id)
        .order_by(desc(JobRun.id))
        .limit(5)
        .all()
    )

    return JobDetail(
        **JobRead.from_orm(job).dict(),
        runs=[JobRunRead.from_orm(run) for run in runs],
    )


@router.post("/jobs/{job_id}/run", response_model=CreateRunResponse)
def trigger_job_run(
    job_id: int,
    session: Session = Depends(get_db),
    queue: JobQueue = Depends(get_queue),
):
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    if job.status not in {JobStatus.active, JobStatus.paused}:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Job is not in a runnable state",
        )

    run = JobRun(
        job_id=job.id,
        status=JobRunStatus.queued,
        triggered_by="manual",
        created_at=datetime.now(timezone.utc),
    )
    session.add(run)
    session.flush()

    message_id = queue.enqueue_job_run(job, run)
    run.queue_message_id = message_id
    session.add(run)
    session.commit()
    session.refresh(run)

    return CreateRunResponse(run=JobRunRead.from_orm(run))


@router.get("/jobs/{job_id}/exports", response_model=List[ArtifactRead])
def get_job_exports(
    job_id: int,
    session: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage_service),
):
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    artifacts = (
        session.query(Artifact)
        .join(JobRun)
        .filter(JobRun.job_id == job.id)
        .order_by(desc(Artifact.created_at))
        .all()
    )

    signed_artifacts: List[ArtifactRead] = []
    for artifact in artifacts:
        signed = storage.sign_export(artifact.storage_path)
        if signed:
            artifact.signed_url, artifact.signed_url_expires_at = signed
        else:
            artifact.signed_url = None
            artifact.signed_url_expires_at = None
        session.add(artifact)
        signed_artifacts.append(ArtifactRead.from_orm(artifact))

    session.commit()
    return signed_artifacts


@router.post("/hooks/worker-callback", status_code=status.HTTP_200_OK)
def worker_callback(
    payload: WorkerCallbackPayload,
    session: Session = Depends(get_db),
    notifications: NotificationBus = Depends(get_notification_bus),
    storage: StorageService = Depends(get_storage_service),
):
    run = session.get(JobRun, payload.run_id)
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")

    if payload.progress is not None:
        run.progress = payload.progress
    run.status = payload.status
    run.started_at = payload.started_at or run.started_at
    run.finished_at = payload.finished_at or run.finished_at
    run.error_message = payload.error_message
    run.metadata = {**run.metadata, **payload.metadata}
    run.updated_at = datetime.now(timezone.utc)

    existing = {artifact.export_format: artifact for artifact in run.artifacts}
    for incoming in payload.artifacts:
        artifact = existing.get(incoming.format)
        if artifact is None:
            artifact = Artifact(
                job_run_id=run.id,
                export_format=incoming.format,
                storage_path=incoming.path,
            )
            run.artifacts.append(artifact)
        else:
            artifact.storage_path = incoming.path

        if incoming.signed_url:
            artifact.signed_url = incoming.signed_url
            if incoming.signed_url_expires_at:
                artifact.signed_url_expires_at = incoming.signed_url_expires_at
            else:
                artifact.signed_url_expires_at = datetime.now(timezone.utc) + timedelta(
                    seconds=storage.ttl_seconds
                )
        else:
            signed = storage.sign_export(artifact.storage_path)
            if signed:
                artifact.signed_url, artifact.signed_url_expires_at = signed
            else:
                artifact.signed_url = None
                artifact.signed_url_expires_at = None
        session.add(artifact)

    session.add(run)
    session.commit()
    session.refresh(run)

    notifications.publish(
        {
            "type": "extract.job_run.updated",
            "job_id": run.job_id,
            "run_id": run.id,
            "status": run.status.value,
            "progress": run.progress,
        }
    )

    return {"status": "ok"}
