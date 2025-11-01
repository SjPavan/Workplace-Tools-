import enum
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class JobStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    paused = "paused"
    archived = "archived"


class JobRunStatus(str, enum.Enum):
    queued = "queued"
    running = "running"
    succeeded = "succeeded"
    failed = "failed"
    cancelled = "cancelled"


class Job(Base):
    __tablename__ = "extract_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    target_urls: Mapped[List[str]] = mapped_column(JSON, default=list)
    selectors: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    scripts: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    schedule_cron: Mapped[Optional[str]] = mapped_column(String(120))
    export_formats: Mapped[List[str]] = mapped_column(JSON, default=list)
    status: Mapped[JobStatus] = mapped_column(Enum(JobStatus), default=JobStatus.active)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    runs: Mapped[List["JobRun"]] = relationship(
        "JobRun", back_populates="job", cascade="all, delete-orphan", order_by="JobRun.id"
    )


class JobRun(Base):
    __tablename__ = "extract_job_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("extract_jobs.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[JobRunStatus] = mapped_column(Enum(JobRunStatus), default=JobRunStatus.queued)
    scheduled_for: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    progress: Mapped[int] = mapped_column(Integer, default=0)
    triggered_by: Mapped[Optional[str]] = mapped_column(String(120))
    queue_message_id: Mapped[Optional[str]] = mapped_column(String(120))
    metadata: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    job: Mapped[Job] = relationship("Job", back_populates="runs")
    artifacts: Mapped[List["Artifact"]] = relationship(
        "Artifact", back_populates="run", cascade="all, delete-orphan", order_by="Artifact.id"
    )


class Artifact(Base):
    __tablename__ = "extract_artifacts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    job_run_id: Mapped[int] = mapped_column(
        ForeignKey("extract_job_runs.id", ondelete="CASCADE"), nullable=False
    )
    export_format: Mapped[str] = mapped_column(String(20), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(512), nullable=False)
    signed_url: Mapped[Optional[str]] = mapped_column(String(1024))
    signed_url_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    run: Mapped[JobRun] = relationship("JobRun", back_populates="artifacts")
