from __future__ import annotations

from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel


class Role(str, Enum):
    USER = "user"
    ADMIN = "admin"


class SupabaseUser(BaseModel):
    id: str
    email: Optional[str] = None
    role: Role = Role.USER
    raw: Dict[str, Any]

    @classmethod
    def from_supabase_payload(cls, payload: Dict[str, Any]) -> "SupabaseUser":
        app_metadata = payload.get("app_metadata") or {}
        role = app_metadata.get("role", Role.USER)
        try:
            role_enum = Role(role)
        except ValueError:
            role_enum = Role.USER
        return cls(
            id=payload.get("id"),
            email=payload.get("email"),
            role=role_enum,
            raw=payload,
        )
