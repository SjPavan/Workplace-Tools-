from __future__ import annotations

from fastapi import FastAPI

from .config import get_settings
from .routers import auth, google_calendar, protected
from .services.storage import DeviceRegistry, GoogleTokenStore
from .utils.encryption import TokenEncryptor


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Workplace Tools Backend",
        description=(
            "FastAPI backend integrating Supabase Auth and Google Calendar "
            "synchronisation for workplace tools."
        ),
        version="0.1.0",
    )

    encryptor = TokenEncryptor(settings.encryption_secret)
    app.state.token_store = GoogleTokenStore(encryptor)
    app.state.device_registry = DeviceRegistry()

    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(
        google_calendar.router,
        prefix="/google/calendar",
        tags=["google-calendar"],
    )
    app.include_router(protected.router, tags=["protected"])

    @app.get("/health", tags=["healthcheck"], summary="API health check")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
