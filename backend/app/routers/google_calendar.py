from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from ..dependencies import get_google_service, get_token_store
from ..schemas.google import (
    CalendarListResponse,
    GoogleDisconnectResponse,
    GoogleOAuthRequest,
    SyncResponse,
)
from ..schemas.user import SupabaseUser
from ..security import require_any_authenticated_user
from ..services.google import GoogleCalendarService
from ..services.storage import GoogleTokenStore

router = APIRouter()


def _merge_token_payload(
    token_data: Dict[str, Any], existing: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    existing = existing or {}
    merged = {
        "access_token": token_data.get("access_token") or existing.get("access_token"),
        "refresh_token": token_data.get("refresh_token") or existing.get("refresh_token"),
        "scope": token_data.get("scope") or existing.get("scope"),
        "token_type": token_data.get("token_type") or existing.get("token_type"),
        "expires_in": token_data.get("expires_in"),
    }
    return merged


async def _retrieve_calendars(
    user: SupabaseUser,
    service: GoogleCalendarService,
    store: GoogleTokenStore,
) -> Dict[str, Any]:
    tokens = store.get_tokens(user.id)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Google tokens stored for user",
        )
    access_token = tokens.get("access_token")
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stored Google credentials are incomplete",
        )
    try:
        return await service.list_calendars(access_token)
    except HTTPException as exc:
        if exc.status_code != status.HTTP_401_UNAUTHORIZED:
            raise
        refresh_token = tokens.get("refresh_token")
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google session expired; reconnect required",
            ) from exc
        refreshed = await service.refresh_token(refresh_token)
        merged = _merge_token_payload(refreshed, existing=tokens)
        new_access_token = merged.get("access_token")
        if not new_access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to refresh Google access token",
            ) from exc
        store.set_tokens(user.id, merged)
        return await service.list_calendars(new_access_token)


@router.post(
    "/connect",
    summary="Connect Google Calendar account",
)
async def connect_google_calendar(
    payload: GoogleOAuthRequest,
    user: SupabaseUser = Depends(require_any_authenticated_user),
    service: GoogleCalendarService = Depends(get_google_service),
    store: GoogleTokenStore = Depends(get_token_store),
) -> SyncResponse:
    token_data = await service.exchange_authorization_code(payload.authorization_code)
    merged = _merge_token_payload(token_data)
    if not merged.get("refresh_token"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google did not return a refresh token",
        )
    if not merged.get("access_token"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google did not return an access token",
        )
    store.set_tokens(user.id, merged)
    return SyncResponse(status="connected")


@router.post(
    "/disconnect",
    response_model=GoogleDisconnectResponse,
    summary="Disconnect Google Calendar account",
)
async def disconnect_google_calendar(
    user: SupabaseUser = Depends(require_any_authenticated_user),
    service: GoogleCalendarService = Depends(get_google_service),
    store: GoogleTokenStore = Depends(get_token_store),
) -> GoogleDisconnectResponse:
    tokens = store.get_tokens(user.id)
    if tokens and tokens.get("access_token"):
        await service.revoke_token(tokens["access_token"])
    store.remove_tokens(user.id)
    return GoogleDisconnectResponse(message="Google Calendar disconnected")


@router.get(
    "/calendars",
    response_model=CalendarListResponse,
    summary="List the user's Google calendars",
)
async def list_calendars(
    user: SupabaseUser = Depends(require_any_authenticated_user),
    service: GoogleCalendarService = Depends(get_google_service),
    store: GoogleTokenStore = Depends(get_token_store),
) -> CalendarListResponse:
    calendars = await _retrieve_calendars(user, service, store)
    items = calendars.get("items")
    return CalendarListResponse(items=items)


@router.post(
    "/sync",
    response_model=SyncResponse,
    summary="Trigger a sample calendar synchronisation job",
)
async def trigger_sync(
    user: SupabaseUser = Depends(require_any_authenticated_user),
    service: GoogleCalendarService = Depends(get_google_service),
    store: GoogleTokenStore = Depends(get_token_store),
) -> SyncResponse:
    calendars = await _retrieve_calendars(user, service, store)
    items = calendars.get("items") or []
    count = len(items) if isinstance(items, list) else 0
    return SyncResponse(status="synced", calendars_synced=count)
