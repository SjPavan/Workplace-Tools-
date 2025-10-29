import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from .api.extract import router as extract_router
from .config import get_settings
from .db import Base, engine
from .dependencies import get_scheduler

logger = logging.getLogger(__name__)


@asynccontextmanager
def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)

    scheduler = get_scheduler()
    try:
        scheduler.start()
    except Exception as exc:  # pragma: no cover - scheduler start failures
        logger.warning("Unable to start scheduler: %s", exc)

    yield

    try:
        scheduler.shutdown()
    except Exception as exc:  # pragma: no cover - shutdown issues
        logger.warning("Unable to stop scheduler cleanly: %s", exc)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Extraction API", version="0.1.0", lifespan=lifespan)
    app.include_router(extract_router, prefix=settings.api_prefix)
    return app


app = create_app()
