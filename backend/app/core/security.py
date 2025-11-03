from __future__ import annotations

from fastapi import HTTPException, status
from starlette.requests import Request

from app.middleware.auth import SupabaseUser


def get_current_user(request: Request) -> SupabaseUser:
    user = request.user
    if isinstance(user, SupabaseUser) and user.is_authenticated:
        return user
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")


__all__ = ["get_current_user"]
