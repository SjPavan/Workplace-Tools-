import pytest
import respx

from backend.app.config import get_settings

pytestmark = pytest.mark.asyncio


@respx.mock
async def test_protected_user_requires_auth(async_client):
    response = await async_client.get("/protected/user")
    assert response.status_code == 401


@respx.mock
async def test_protected_user_success(async_client):
    settings = get_settings()
    respx.get(f"{settings.supabase_url}/auth/v1/user").respond(
        json={
            "id": "user-1",
            "email": "user@example.com",
            "app_metadata": {"role": "user"},
        }
    )

    response = await async_client.get(
        "/protected/user",
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 200
    assert "Hello" in response.json()["message"]


@respx.mock
async def test_protected_admin_forbidden_for_user(async_client):
    settings = get_settings()
    respx.get(f"{settings.supabase_url}/auth/v1/user").respond(
        json={
            "id": "user-1",
            "email": "user@example.com",
            "app_metadata": {"role": "user"},
        }
    )

    response = await async_client.get(
        "/protected/admin",
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 403


@respx.mock
async def test_protected_admin_success(async_client):
    settings = get_settings()
    respx.get(f"{settings.supabase_url}/auth/v1/user").respond(
        json={
            "id": "admin-1",
            "email": "admin@example.com",
            "app_metadata": {"role": "admin"},
        }
    )

    response = await async_client.get(
        "/protected/admin",
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 200
    assert "Welcome admin" in response.json()["message"]
