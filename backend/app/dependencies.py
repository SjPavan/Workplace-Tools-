from __future__ import annotations

from fastapi import Depends, Request

from .config import Settings, get_settings
from .services.google import GoogleCalendarService
from .services.storage import DeviceRegistry, GoogleTokenStore
from .services.supabase import SupabaseAuthClient
from .utils.encryption import TokenEncryptor


def get_supabase_client(settings: Settings = Depends(get_settings)) -> SupabaseAuthClient:
    return SupabaseAuthClient(settings)


def get_google_service(settings: Settings = Depends(get_settings)) -> GoogleCalendarService:
    return GoogleCalendarService(settings)


def get_token_store(request: Request, settings: Settings = Depends(get_settings)) -> GoogleTokenStore:
    store: GoogleTokenStore | None = getattr(request.app.state, "token_store", None)
    if store is None:
        encryptor = TokenEncryptor(settings.encryption_secret)
        store = GoogleTokenStore(encryptor)
        request.app.state.token_store = store
    return store


def get_device_registry(request: Request) -> DeviceRegistry:
    registry: DeviceRegistry | None = getattr(request.app.state, "device_registry", None)
    if registry is None:
        registry = DeviceRegistry()
        request.app.state.device_registry = registry
    return registry
