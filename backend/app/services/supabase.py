from __future__ import annotations

from typing import Any, Dict, Optional

import httpx
from fastapi import HTTPException, status

from ..config import Settings

SUPABASE_AUTH_PATH = "/auth/v1"


class SupabaseAuthError(HTTPException):
    def __init__(self, detail: Any, status_code: int) -> None:
        super().__init__(status_code=status_code, detail=detail)


class SupabaseAuthClient:
    """Small wrapper around Supabase Auth endpoints required by the API."""

    def __init__(self, settings: Settings) -> None:
        self._base_auth_url = settings.supabase_url.rstrip("/") + SUPABASE_AUTH_PATH
        self._anon_key = settings.supabase_anon_key

    async def _post_token(
        self, *, params: Dict[str, str], payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{self._base_auth_url}/token",
                params=params,
                json=payload,
                headers={"apikey": self._anon_key, "Content-Type": "application/json"},
            )
        if response.status_code >= 400:
            raise SupabaseAuthError(
                detail=response.json() if response.content else response.text,
                status_code=response.status_code,
            )
        return response.json()

    async def sign_in_with_password(self, *, email: str, password: str) -> Dict[str, Any]:
        return await self._post_token(
            params={"grant_type": "password"},
            payload={"email": email, "password": password},
        )

    async def exchange_id_token(
        self, *, provider: str, id_token: str, nonce: Optional[str] = None
    ) -> Dict[str, Any]:
        payload: Dict[str, Any] = {"id_token": id_token, "provider": provider}
        if nonce:
            payload["nonce"] = nonce
        return await self._post_token(
            params={"grant_type": "id_token"},
            payload=payload,
        )

    async def refresh_session(self, *, refresh_token: str) -> Dict[str, Any]:
        return await self._post_token(
            params={"grant_type": "refresh_token"},
            payload={"refresh_token": refresh_token},
        )

    async def get_user(self, access_token: str) -> Dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "apikey": self._anon_key,
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{self._base_auth_url}/user", headers=headers)
        if response.status_code >= 400:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to validate Supabase session",
            )
        return response.json()
