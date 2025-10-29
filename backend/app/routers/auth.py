from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from ..dependencies import (
    get_device_registry,
    get_supabase_client,
)
from ..schemas.auth import (
    DeviceRegisterRequest,
    GrantType,
    MessageResponse,
    RefreshRequest,
    SessionExchangeRequest,
    SessionTokenResponse,
)
from ..services.storage import DeviceRegistry
from ..services.supabase import SupabaseAuthClient, SupabaseAuthError

router = APIRouter()


@router.post(
    "/session/exchange",
    response_model=SessionTokenResponse,
    summary="Exchange credentials for a Supabase session",
)
async def exchange_session(
    payload: SessionExchangeRequest,
    supabase: SupabaseAuthClient = Depends(get_supabase_client),
) -> SessionTokenResponse:
    try:
        if payload.grant_type == GrantType.PASSWORD:
            email = payload.email
            password = payload.password
            assert email and password
            result = await supabase.sign_in_with_password(
                email=email, password=password
            )
        elif payload.grant_type == GrantType.REFRESH_TOKEN:
            refresh_token = payload.refresh_token
            assert refresh_token
            result = await supabase.refresh_session(
                refresh_token=refresh_token
            )
        else:
            provider = payload.provider
            id_token = payload.id_token
            assert provider and id_token
            result = await supabase.exchange_id_token(
                provider=provider,
                id_token=id_token,
                nonce=payload.nonce,
            )
    except SupabaseAuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    return SessionTokenResponse(**result)


@router.post(
    "/session/refresh",
    response_model=SessionTokenResponse,
    summary="Refresh a Supabase session using a refresh token",
)
async def refresh_session(
    payload: RefreshRequest,
    supabase: SupabaseAuthClient = Depends(get_supabase_client),
) -> SessionTokenResponse:
    try:
        result = await supabase.refresh_session(refresh_token=payload.refresh_token)
    except SupabaseAuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    return SessionTokenResponse(**result)


@router.post(
    "/device/register",
    response_model=MessageResponse,
    summary="Register a device refresh token with the backend",
)
async def register_device(
    payload: DeviceRegisterRequest,
    registry: DeviceRegistry = Depends(get_device_registry),
) -> MessageResponse:
    registry.register_device(payload.device_id, payload.refresh_token)
    return MessageResponse(message="Device registered")
