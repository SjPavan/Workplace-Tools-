from fastapi import FastAPI

from . import ai, auth, health, version


def register_routes(app: FastAPI) -> None:
    app.include_router(health.router)
    app.include_router(version.router)
    app.include_router(auth.router)
    app.include_router(ai.router)


__all__ = ["register_routes"]
