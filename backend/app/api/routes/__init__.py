from fastapi import FastAPI

from . import auth, health, version


def register_routes(app: FastAPI) -> None:
    app.include_router(health.router)
    app.include_router(version.router)
    app.include_router(auth.router)


__all__ = ["register_routes"]
