from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.middleware.authentication import AuthenticationMiddleware

from app.api.routes import register_routes
from app.core.config import settings
from app.core.logging import configure_logging
from app.core.rate_limit import limiter
from app.middleware.auth import SupabaseJWTBackend, authentication_error_handler


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    configure_logging()

    app = FastAPI(
        title=settings.project_name,
        version=settings.version,
        docs_url=None if settings.environment == "production" else settings.docs_url,
        openapi_url=settings.openapi_url,
    )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_middleware(
        AuthenticationMiddleware,
        backend=SupabaseJWTBackend(),
        on_error=authentication_error_handler,
    )

    register_routes(app)

    return app


app = create_app()
