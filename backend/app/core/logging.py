from __future__ import annotations

import logging
from logging.config import dictConfig

from app.core.config import settings


def configure_logging() -> None:
    """Configure application-wide logging using standard library primitives."""
    log_level = settings.log_level.upper()

    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
            },
            "uvicorn": {
                "format": "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
            },
        },
        "handlers": {
            "default": {
                "level": log_level,
                "class": "logging.StreamHandler",
                "formatter": "standard",
            },
            "uvicorn": {
                "level": log_level,
                "class": "logging.StreamHandler",
                "formatter": "uvicorn",
            },
        },
        "loggers": {
            "": {
                "handlers": ["default"],
                "level": log_level,
                "propagate": True,
            },
            "uvicorn": {
                "handlers": ["uvicorn"],
                "level": log_level,
                "propagate": False,
            },
            "uvicorn.error": {
                "handlers": ["uvicorn"],
                "level": log_level,
                "propagate": False,
            },
            "uvicorn.access": {
                "handlers": ["uvicorn"],
                "level": log_level,
                "propagate": False,
            },
        },
    }

    dictConfig(logging_config)
