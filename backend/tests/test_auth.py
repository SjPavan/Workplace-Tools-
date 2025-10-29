import pytest
import respx

from backend.app.config import get_settings

pytestmark = pytest.mark.asyncio


@respx.mock
async def test_session_exchange_password_success(async_client):
    settings = get_settings()
    route = respx.post(f"{settings.supabase_url}/auth/v1/token").respond(
        json={
            "access_token": "access-token",
            "refresh_token": "refresh-token",
            "expires_in": 3600,
            "token_type": "bearer",
            "user": {"id": "123", "email": "user@example.com"},
        },
        status_code=200,
    )

    response = await async_client.post(
        "/auth/session/exchange",
        json={
            "grant_type": "password",
            "email": "user@example.com",
            "password": "password123",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["access_token"] == "access-token"
    assert route.called


@respx.mock
async def test_session_exchange_invalid_credentials(async_client):
    settings = get_settings()
    respx.post(f"{settings.supabase_url}/auth/v1/token").respond(
        json={"message": "Invalid login"}, status_code=400
    )

    response = await async_client.post(
        "/auth/session/exchange",
        json={
            "grant_type": "password",
            "email": "user@example.com",
            "password": "wrong",
        },
    )

    assert response.status_code == 400


@respx.mock
async def test_refresh_session(async_client):
    settings = get_settings()
    respx.post(f"{settings.supabase_url}/auth/v1/token").respond(
        json={
            "access_token": "new-access",
            "refresh_token": "refresh-token",
            "expires_in": 3600,
            "token_type": "bearer",
            "user": {"id": "123"},
        }
    )

    response = await async_client.post(
        "/auth/session/refresh",
        json={"refresh_token": "refresh-token"},
    )

    assert response.status_code == 200
    assert response.json()["access_token"] == "new-access"


async def test_device_register(async_client):
    response = await async_client.post(
        "/auth/device/register",
        json={"device_id": "device-1", "refresh_token": "refresh"},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Device registered"
