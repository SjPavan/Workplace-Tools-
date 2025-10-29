from __future__ import annotations

from typing import Callable

from fastapi import Depends, HTTPException, Request, status

from .dependencies import get_supabase_client
from .schemas.user import Role, SupabaseUser
from .services.supabase import SupabaseAuthClient


async def get_current_user(
    request: Request, supabase: SupabaseAuthClient = Depends(get_supabase_client)
) -> SupabaseUser:
    authorization: str | None = request.headers.get("Authorization")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )

    access_token = authorization.removeprefix("Bearer ").strip()
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header",
        )
    payload = await supabase.get_user(access_token)
    user = SupabaseUser.from_supabase_payload(payload)
    if not user.id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Supabase user payload invalid",
        )
    return user


def require_role(role: Role) -> Callable[[SupabaseUser], SupabaseUser]:
    async def dependency(user: SupabaseUser = Depends(get_current_user)) -> SupabaseUser:
        if user.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return dependency


async def require_any_authenticated_user(
    user: SupabaseUser = Depends(get_current_user),
) -> SupabaseUser:
    return user
