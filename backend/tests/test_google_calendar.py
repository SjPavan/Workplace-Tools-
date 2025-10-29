import pytest
import respx
from httpx import Response

from backend.app.config import get_settings

pytestmark = pytest.mark.asyncio


async def authenticate(respx_mock):
    settings = get_settings()
    respx_mock.get(f"{settings.supabase_url}/auth/v1/user").respond(
        json={
            "id": "user-1",
            "email": "user@example.com",
            "app_metadata": {"role": "user"},
        }
    )


@respx.mock
async def test_google_connect_and_list(async_client):
    await authenticate(respx)
    respx.post("https://oauth2.googleapis.com/token").respond(
        json={
            "access_token": "google-access",
            "refresh_token": "google-refresh",
            "token_type": "Bearer",
            "expires_in": 3600,
            "scope": "calendar.readonly",
        }
    )

    response = await async_client.post(
        "/google/calendar/connect",
        json={"authorization_code": "auth-code"},
        headers={"Authorization": "Bearer supabase-token"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "connected"

    respx.get("https://www.googleapis.com/calendar/v3/users/me/calendarList").respond(
        json={"items": [{"id": "cal-1"}, {"id": "cal-2"}]}
    )

    list_response = await async_client.get(
        "/google/calendar/calendars",
        headers={"Authorization": "Bearer supabase-token"},
    )

    assert list_response.status_code == 200
    assert len(list_response.json().get("items")) == 2



@respx.mock
async def test_google_list_requires_connection(async_client):
    await authenticate(respx)

    response = await async_client.get(
        "/google/calendar/calendars",
        headers={"Authorization": "Bearer supabase-token"},
    )

    assert response.status_code == 404


@respx.mock
async def test_google_disconnect(async_client):
    settings = get_settings()
    await authenticate(respx)
    respx.post("https://oauth2.googleapis.com/token").respond(
        json={
            "access_token": "google-access",
            "refresh_token": "google-refresh",
            "token_type": "Bearer",
            "expires_in": 3600,
        }
    )

    await async_client.post(
        "/google/calendar/connect",
        json={"authorization_code": "auth-code"},
        headers={"Authorization": "Bearer supabase-token"},
    )

    respx.post("https://oauth2.googleapis.com/revoke").respond(status_code=200)

    response = await async_client.post(
        "/google/calendar/disconnect",
        headers={"Authorization": "Bearer supabase-token"},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Google Calendar disconnected"


@respx.mock
async def test_google_sync_job(async_client):
    await authenticate(respx)

    respx.post("https://oauth2.googleapis.com/token").respond(
        json={
            "access_token": "google-access",
            "refresh_token": "google-refresh",
            "token_type": "Bearer",
            "expires_in": 3600,
        }
    )

    await async_client.post(
        "/google/calendar/connect",
        json={"authorization_code": "auth-code"},
        headers={"Authorization": "Bearer supabase-token"},
    )

    respx.get("https://www.googleapis.com/calendar/v3/users/me/calendarList").respond(
        json={"items": [{"id": "cal-1"}, {"id": "cal-2"}, {"id": "cal-3"}]}
    )

    response = await async_client.post(
        "/google/calendar/sync",
        headers={"Authorization": "Bearer supabase-token"},
    )

    assert response.status_code == 200
    assert response.json() == {"status": "synced", "calendars_synced": 3}


@respx.mock
async def test_google_refreshes_expired_token(async_client):
    await authenticate(respx)

    token_route = respx.post("https://oauth2.googleapis.com/token")
    token_route.mock(
        side_effect=[
            Response(
                status_code=200,
                json={
                    "access_token": "stale-access",
                    "refresh_token": "google-refresh",
                    "token_type": "Bearer",
                    "expires_in": 3600,
                },
            ),
            Response(
                status_code=200,
                json={
                    "access_token": "fresh-access",
                    "refresh_token": "google-refresh",
                    "token_type": "Bearer",
                    "expires_in": 3600,
                },
            ),
        ]
    )

    await async_client.post(
        "/google/calendar/connect",
        json={"authorization_code": "auth-code"},
        headers={"Authorization": "Bearer supabase-token"},
    )

    calendar_route = respx.get(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList"
    )
    calendar_route.mock(
        side_effect=[
            Response(status_code=401, json={"error": "expired"}),
            Response(status_code=200, json={"items": [{"id": "cal-1"}]}),
        ]
    )

    response = await async_client.get(
        "/google/calendar/calendars",
        headers={"Authorization": "Bearer supabase-token"},
    )

    assert response.status_code == 200
    assert len(response.json().get("items")) == 1
