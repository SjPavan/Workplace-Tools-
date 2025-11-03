from __future__ import annotations

from fastapi import APIRouter

from app.core.config import settings
from app.core.rate_limit import limiter

router = APIRouter(prefix="/version", tags=["version"])


@router.get("", name="version:info")
@limiter.limit(settings.rate_limit)
async def version_info() -> dict[str, str]:
    """Expose service metadata for client discovery."""
    return {
        "name": settings.project_name,
        "version": settings.version,
        "environment": settings.environment,
    }
