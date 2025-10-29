from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, HttpUrl, validator

from .models import JobRunStatus, JobStatus


class ArtifactRead(BaseModel):
    id: int
    export_format: str
    storage_path: str
    signed_url: Optional[str]
    signed_url_expires_at: Optional[datetime]

    class Config:
        orm_mode = True


class JobRunRead(BaseModel):
    id: int
    job_id: int
    status: JobRunStatus
    scheduled_for: Optional[datetime]
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    progress: int
    triggered_by: Optional[str]
    queue_message_id: Optional[str]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime
    artifacts: List[ArtifactRead] = Field(default_factory=list)

    class Config:
        orm_mode = True


class JobBase(BaseModel):
    name: str = Field(..., description="Friendly job name")
    description: Optional[str] = None
    target_urls: List[HttpUrl] = Field(..., description="List of target URLs to scrape")
    selectors: Dict[str, Any] = Field(default_factory=dict)
    scripts: Dict[str, Any] = Field(default_factory=dict)
    schedule_cron: Optional[str] = Field(
        None, description="Cron expression for recurring schedule"
    )
    export_formats: List[str] = Field(default_factory=list)
    status: JobStatus = Field(default=JobStatus.active)

    @validator("export_formats", always=True)
    def validate_exports(cls, value):  # type: ignore[override]
        if not value:
            return ["csv"]
        return value


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    name: Optional[str]
    description: Optional[str]
    target_urls: Optional[List[HttpUrl]]
    selectors: Optional[Dict[str, Any]]
    scripts: Optional[Dict[str, Any]]
    schedule_cron: Optional[str]
    export_formats: Optional[List[str]]
    status: Optional[JobStatus]


class JobRead(JobBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class JobDetail(JobRead):
    runs: List[JobRunRead]


class PaginatedJobs(BaseModel):
    items: List[JobRead]
    total: int
    page: int
    page_size: int


class CreateRunResponse(BaseModel):
    run: JobRunRead


class WorkerArtifactPayload(BaseModel):
    format: str = Field(..., alias="export_format")
    path: str = Field(..., alias="storage_path")
    signed_url: Optional[str] = None
    signed_url_expires_at: Optional[datetime] = None


class WorkerCallbackPayload(BaseModel):
    run_id: int
    status: JobRunStatus
    progress: Optional[int] = Field(default=None, ge=0, le=100)
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    error_message: Optional[str]
    metadata: Dict[str, Any] = Field(default_factory=dict)
    artifacts: List[WorkerArtifactPayload] = Field(default_factory=list)
