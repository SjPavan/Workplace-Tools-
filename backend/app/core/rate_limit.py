from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

_default_limits = [settings.rate_limit] if settings.rate_limit else []

limiter = Limiter(key_func=get_remote_address, default_limits=_default_limits)

__all__ = ["limiter"]
