from __future__ import annotations

from typing import Any

from fastapi import status
from jose import JWTError, jwt
from starlette.authentication import (
    AuthCredentials,
    AuthenticationError,
    AuthenticationBackend,
    SimpleUser,
)
from starlette.requests import HTTPConnection
from starlette.responses import JSONResponse

from app.core.config import settings


class SupabaseUser(SimpleUser):
    """Starlette user model enriched with Supabase JWT claims."""

    def __init__(self, user_id: str, claims: dict[str, Any]):
        super().__init__(username=user_id)
        self.user_id = user_id
        self.claims = claims


class SupabaseJWTBackend(AuthenticationBackend):
    """Authentication backend that validates Supabase-issued JWTs."""

    async def authenticate(self, conn: HTTPConnection):
        authorization_header = conn.headers.get("Authorization")
        if not authorization_header:
            return None

        parts = authorization_header.split(" ", 1)
        if len(parts) != 2:
            raise AuthenticationError("Malformed authorization header")

        scheme, token = parts
        if scheme.lower() != "bearer":
            raise AuthenticationError("Unsupported authorization scheme")

        if not settings.supabase_jwt_secret:
            raise AuthenticationError("Supabase JWT secret is not configured")

        try:
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=settings.jwt_algorithms,
                options={"verify_aud": False},
            )
        except JWTError as exc:
            raise AuthenticationError("Invalid or expired token") from exc

        user_id = payload.get("sub") or payload.get("user_id")
        if not user_id:
            raise AuthenticationError("Token missing subject claim")

        credentials = AuthCredentials(["authenticated"])
        return credentials, SupabaseUser(user_id=user_id, claims=payload)


def authentication_error_handler(conn: HTTPConnection, exc: Exception) -> JSONResponse:
    """Render authentication failures as JSON API responses."""
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": "Not authenticated"},
    )


__all__ = ["SupabaseJWTBackend", "authentication_error_handler", "SupabaseUser"]
