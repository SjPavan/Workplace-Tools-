from functools import lru_cache
from typing import List, Optional

from pydantic import BaseSettings, Field, validator


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    api_prefix: str = Field("/extract", description="Base path for extraction routes")
    database_url: str = Field(
        "sqlite:///./backend.db",
        description="SQLAlchemy connection string",
        alias="DATABASE_URL",
    )
    redis_url: Optional[str] = Field(None, alias="REDIS_URL")
    redis_queue_name: str = Field("extract.jobs", alias="REDIS_QUEUE_NAME")
    supabase_project_url: Optional[str] = Field(None, alias="SUPABASE_PROJECT_URL")
    supabase_storage_bucket: Optional[str] = Field(None, alias="SUPABASE_STORAGE_BUCKET")
    export_signing_secret: str = Field(
        "dev-export-secret",
        alias="EXPORT_SIGNING_SECRET",
        description="Secret used to sign export URLs",
    )
    export_url_ttl_seconds: int = Field(3600, alias="EXPORT_URL_TTL_SECONDS")
    notification_topic: str = Field("extract.job.notifications")
    scheduler_enabled: bool = Field(True, alias="SCHEDULER_ENABLED")
    scheduler_timezone: str = Field("UTC", alias="SCHEDULER_TIMEZONE")
    allowed_export_formats: List[str] = Field(
        default_factory=lambda: ["csv", "json", "xlsx"],
        description="Permitted export formats",
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    @validator("allowed_export_formats", pre=True)
    def _split_export_formats(cls, value):  # type: ignore[override]
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
