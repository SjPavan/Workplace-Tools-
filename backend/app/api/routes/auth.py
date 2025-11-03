from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends

from app.core.rate_limit import limiter
from app.core.security import get_current_user
from app.middleware.auth import SupabaseUser

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", name="auth:me")
@limiter.limit("10/minute")
async def read_current_user(current_user: SupabaseUser = Depends(get_current_user)) -> dict[str, Any]:
    """Return the identity extracted from the Supabase JWT."""
    response: dict[str, Any] = {
        "user_id": current_user.user_id,
        "audience": current_user.claims.get("aud"),
    }
    email = current_user.claims.get("email")
    if email:
        response["email"] = email
    return response
