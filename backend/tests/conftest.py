import os
from typing import AsyncIterator

import pytest
from httpx import AsyncClient

from backend.app.config import get_settings
from backend.app.main import create_app


@pytest.fixture(scope="session", autouse=True)
def configure_env() -> None:
    os.environ.setdefault("SUPABASE_URL", "https://mock.supabase.co")
    os.environ.setdefault("SUPABASE_ANON_KEY", "anon-key")
    os.environ.setdefault("GOOGLE_CLIENT_ID", "google-client-id")
    os.environ.setdefault("GOOGLE_CLIENT_SECRET", "google-client-secret")
    os.environ.setdefault("REDIRECT_URI", "https://localhost/callback")
    os.environ.setdefault("ENCRYPTION_SECRET", "super-secret-value")
    get_settings.cache_clear()


@pytest.fixture()
async def async_client() -> AsyncIterator[AsyncClient]:
    app = create_app()
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
