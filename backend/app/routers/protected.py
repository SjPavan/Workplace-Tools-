from __future__ import annotations

from fastapi import APIRouter, Depends

from ..schemas.user import Role, SupabaseUser
from ..security import require_any_authenticated_user, require_role

router = APIRouter()


@router.get(
    "/protected/user",
    summary="Protected endpoint accessible to any authenticated user",
)
async def protected_user_route(
    user: SupabaseUser = Depends(require_any_authenticated_user),
) -> dict[str, str]:
    return {"message": f"Hello, {user.email or user.id}!"}


@router.get(
    "/protected/admin",
    summary="Protected endpoint restricted to admin role",
)
async def protected_admin_route(
    user: SupabaseUser = Depends(require_role(Role.ADMIN)),
) -> dict[str, str]:
    return {"message": f"Welcome admin {user.email or user.id}"}
