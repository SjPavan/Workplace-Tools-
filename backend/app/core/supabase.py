from __future__ import annotations

from functools import lru_cache

from supabase import Client, create_client

from app.core.config import settings


class SupabaseConfigurationError(RuntimeError):
    """Raised when required Supabase configuration is missing."""


@lru_cache
def get_service_role_client() -> Client:
    """Return a Supabase client configured with the service role key."""
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise SupabaseConfigurationError(
            "Supabase URL and service role key must be configured to create a client.",
        )
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@lru_cache
def get_anon_client() -> Client:
    """Return a Supabase client configured with the anon key."""
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise SupabaseConfigurationError(
            "Supabase URL and anon key must be configured to create a client.",
        )
    return create_client(settings.supabase_url, settings.supabase_anon_key)


__all__ = ["get_service_role_client", "get_anon_client", "SupabaseConfigurationError"]
