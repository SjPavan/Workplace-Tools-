"""Configuration objects for the scraping worker service."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import List

from .user_agents import DEFAULT_USER_AGENTS


def _env_bool(key: str, default: bool) -> bool:
    value = os.getenv(key)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_int(key: str, default: int) -> int:
    value = os.getenv(key)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


def _env_float(key: str, default: float) -> float:
    value = os.getenv(key)
    if value is None:
        return default
    try:
        return float(value)
    except ValueError:
        return default


def _env_list(key: str, default: List[str]) -> List[str]:
    value = os.getenv(key)
    if value is None:
        return list(default)
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class WorkerConfig:
    """Runtime configuration for the scraping worker."""

    redis_url: str = field(default_factory=lambda: os.getenv("REDIS_URL", "redis://localhost:6379/0"))
    redis_queue: str = field(default_factory=lambda: os.getenv("SCRAPING_QUEUE", "scraping-jobs"))

    supabase_url: str = field(default_factory=lambda: os.getenv("SUPABASE_URL", ""))
    supabase_key: str = field(default_factory=lambda: os.getenv("SUPABASE_KEY", ""))
    supabase_bucket: str = field(default_factory=lambda: os.getenv("SUPABASE_BUCKET", "scraping-datasets"))

    headless: bool = field(default_factory=lambda: _env_bool("PLAYWRIGHT_HEADLESS", True))
    navigation_timeout_ms: int = field(default_factory=lambda: _env_int("PLAYWRIGHT_NAVIGATION_TIMEOUT_MS", 30_000))
    request_timeout_ms: int = field(default_factory=lambda: _env_int("PLAYWRIGHT_REQUEST_TIMEOUT_MS", 30_000))

    max_retries: int = field(default_factory=lambda: _env_int("SCRAPING_MAX_RETRIES", 3))
    backoff_factor: float = field(default_factory=lambda: _env_float("SCRAPING_BACKOFF_FACTOR", 2.0))
    base_backoff_seconds: float = field(default_factory=lambda: _env_float("SCRAPING_BASE_BACKOFF_SECONDS", 1.0))

    user_agents: List[str] = field(default_factory=lambda: _env_list("SCRAPING_USER_AGENTS", DEFAULT_USER_AGENTS))

    @property
    def supabase_enabled(self) -> bool:
        return bool(self.supabase_url and self.supabase_key and self.supabase_bucket)

    @classmethod
    def from_env(cls) -> "WorkerConfig":
        return cls()
