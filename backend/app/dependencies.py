from functools import lru_cache
from typing import Generator

from sqlalchemy.orm import Session

from .config import get_settings
from .db import get_db_session
from .services.notifications import NotificationBus
from .services.queue import InMemoryJobQueue, JobQueue, RedisJobQueue
from .services.scheduler import APSchedulerAdapter, NullScheduler, Scheduler
from .services.storage import StorageService


def get_db() -> Generator[Session, None, None]:
    yield from get_db_session()


@lru_cache
def get_queue() -> JobQueue:
    settings = get_settings()
    if settings.redis_url:
        return RedisJobQueue(settings.redis_url, settings.redis_queue_name)
    return InMemoryJobQueue()


@lru_cache
def get_scheduler() -> Scheduler:
    settings = get_settings()
    if not settings.scheduler_enabled:
        return NullScheduler()

    try:
        return APSchedulerAdapter(queue=get_queue(), timezone=settings.scheduler_timezone)
    except RuntimeError:
        return NullScheduler()


@lru_cache
def get_notification_bus() -> NotificationBus:
    settings = get_settings()
    return NotificationBus(topic=settings.notification_topic)


@lru_cache
def get_storage_service() -> StorageService:
    settings = get_settings()
    return StorageService(
        signing_secret=settings.export_signing_secret,
        ttl_seconds=settings.export_url_ttl_seconds,
    )
