from __future__ import annotations

from functools import lru_cache
from typing import Any

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.example"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    environment: str = Field(default="development", validation_alias=AliasChoices("ENVIRONMENT"))
    project_name: str = Field(
        default="Workplace Tools API",
        validation_alias=AliasChoices("PROJECT_NAME"),
    )
    version: str = Field(default="0.1.0", validation_alias=AliasChoices("API_VERSION", "VERSION"))
    log_level: str = Field(default="INFO", validation_alias=AliasChoices("LOG_LEVEL"))
    rate_limit: str = Field(default="100/minute", validation_alias=AliasChoices("RATE_LIMIT"))
    docs_url: str | None = Field(default="/docs", validation_alias=AliasChoices("DOCS_URL"))
    openapi_url: str = Field(default="/openapi.json", validation_alias=AliasChoices("OPENAPI_URL"))
    cors_origins: list[str] = Field(default_factory=lambda: ["*"], validation_alias=AliasChoices("CORS_ORIGINS"))

    database_url: str = Field(default="", validation_alias=AliasChoices("DATABASE_URL"))

    supabase_url: str = Field(default="", validation_alias=AliasChoices("SUPABASE_URL"))
    supabase_anon_key: str = Field(default="", validation_alias=AliasChoices("SUPABASE_ANON_KEY"))
    supabase_service_role_key: str = Field(
        default="",
        validation_alias=AliasChoices("SUPABASE_SERVICE_ROLE_KEY"),
    )
    supabase_jwt_secret: str = Field(default="", validation_alias=AliasChoices("SUPABASE_JWT_SECRET"))
    jwt_algorithms: list[str] = Field(default_factory=lambda: ["HS256"], validation_alias=AliasChoices("JWT_ALGORITHMS"))

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_cors_origins(cls, value: Any) -> list[str]:
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return []
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        if isinstance(value, (list, tuple)):
            return [str(origin).strip() for origin in value if str(origin).strip()]
        return ["*"]

    @field_validator("jwt_algorithms", mode="before")
    @classmethod
    def normalise_algorithms(cls, value: Any) -> list[str]:
        if isinstance(value, str):
            return [alg.strip() for alg in value.split(",") if alg.strip()]
        if isinstance(value, (list, tuple)):
            return [str(alg).strip() for alg in value if str(alg).strip()]
        return ["HS256"]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
