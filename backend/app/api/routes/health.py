from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.rate_limit import limiter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", name="health:status")
@limiter.exempt
async def health_status() -> dict[str, str]:
    """Basic health-check endpoint for uptime monitoring."""
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
