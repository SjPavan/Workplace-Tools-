from __future__ import annotations

from typing import Any, Dict, Optional

import httpx
from fastapi import HTTPException, status

from ..config import Settings

GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
GOOGLE_CALENDAR_LIST_ENDPOINT = (
    "https://www.googleapis.com/calendar/v3/users/me/calendarList"
)


class GoogleCalendarService:
    """Manages Google OAuth exchanges and Calendar API interactions."""

    def __init__(self, settings: Settings) -> None:
        self._client_id = settings.google_client_id
        self._client_secret = settings.google_client_secret
        self._redirect_uri = settings.redirect_uri

    async def exchange_authorization_code(self, code: str) -> Dict[str, Any]:
        payload = {
            "code": code,
            "client_id": self._client_id,
            "client_secret": self._client_secret,
            "redirect_uri": str(self._redirect_uri),
            "grant_type": "authorization_code",
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(GOOGLE_TOKEN_ENDPOINT, data=payload)
        if response.status_code >= 400:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange Google authorization code",
            )
        return response.json()

    async def revoke_token(self, token: str) -> None:
        revoke_endpoint = "https://oauth2.googleapis.com/revoke"
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                revoke_endpoint,
                params={"token": token},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
        if response.status_code not in (200, 400):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to revoke Google token",
            )

    async def list_calendars(self, access_token: str) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {access_token}"}
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(GOOGLE_CALENDAR_LIST_ENDPOINT, headers=headers)
        if response.status_code == status.HTTP_401_UNAUTHORIZED:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google access token expired",
            )
        if response.status_code >= 400:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to fetch calendars from Google",
            )
        return response.json()

    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        payload = {
            "client_id": self._client_id,
            "client_secret": self._client_secret,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(GOOGLE_TOKEN_ENDPOINT, data=payload)
        if response.status_code >= 400:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to refresh Google access token",
            )
        return response.json()
