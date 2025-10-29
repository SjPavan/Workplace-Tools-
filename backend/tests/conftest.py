from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from backend.app.config import get_settings
from backend.app.db import Base
from backend.app.dependencies import (
    get_db,
    get_notification_bus,
    get_queue,
    get_scheduler,
    get_storage_service,
)
from backend.app.main import create_app
from backend.app.services.notifications import NotificationBus
from backend.app.services.queue import InMemoryJobQueue
from backend.app.services.scheduler import NullScheduler
from backend.app.services.storage import StorageService

TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="session")
def engine():  # type: ignore
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(engine) -> Generator[Session, None, None]:
    connection = engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection, expire_on_commit=False)()
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def test_dependencies(db_session):
    # Clear cached dependency singletons
    get_queue.cache_clear()
    get_scheduler.cache_clear()
    get_notification_bus.cache_clear()
    get_storage_service.cache_clear()

    settings = get_settings()
    settings.supabase_project_url = "https://supabase.local"
    settings.supabase_storage_bucket = "exports"
    settings.scheduler_enabled = False

    queue = InMemoryJobQueue()
    scheduler = NullScheduler()
    notifications = NotificationBus(topic="test.topic")
    storage = StorageService(signing_secret="test-secret", ttl_seconds=600)

    def override_db():
        yield db_session

    return {
        get_db: override_db,
        get_queue: lambda: queue,
        get_scheduler: lambda: scheduler,
        get_notification_bus: lambda: notifications,
        get_storage_service: lambda: storage,
        "queue": queue,
        "notifications": notifications,
    }


@pytest.fixture(scope="function")
def client(test_dependencies):
    app = create_app()
    for dependency, override in test_dependencies.items():
        if callable(dependency):
            app.dependency_overrides[dependency] = override
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def in_memory_queue(test_dependencies) -> InMemoryJobQueue:
    return test_dependencies["queue"]


@pytest.fixture(scope="function")
def notification_bus(test_dependencies) -> NotificationBus:
    return test_dependencies["notifications"]
