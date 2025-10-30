"""Caching primitives for forecast computation results."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Any, Dict, Optional, Tuple


@dataclass
class CacheEntry:
    """Internal representation of a cached forecast."""

    value: Any
    created_at: datetime

    def is_expired(self, ttl_seconds: Optional[int]) -> bool:
        if ttl_seconds is None:
            return False
        return self.created_at + timedelta(seconds=ttl_seconds) < datetime.now(timezone.utc)


class ForecastCache:
    """Thread-safe in-memory cache for forecast responses."""

    def __init__(self, ttl_seconds: Optional[int] = 900) -> None:
        self.ttl_seconds = ttl_seconds
        self._store: Dict[Tuple[str, str, int, Optional[str]], CacheEntry] = {}
        self._lock = Lock()

    def _make_key(
        self,
        dataset_hash: str,
        model_version: str,
        horizon: int,
        config_digest: Optional[str],
    ) -> Tuple[str, str, int, Optional[str]]:
        return dataset_hash, model_version, horizon, config_digest

    def get(
        self,
        dataset_hash: str,
        model_version: str,
        horizon: int,
        config_digest: Optional[str] = None,
    ) -> Any | None:
        """Retrieve a cached value if present and not expired."""

        key = self._make_key(dataset_hash, model_version, horizon, config_digest)
        with self._lock:
            entry = self._store.get(key)
            if not entry:
                return None
            if entry.is_expired(self.ttl_seconds):
                del self._store[key]
                return None
            return entry.value

    def set(
        self,
        dataset_hash: str,
        model_version: str,
        horizon: int,
        value: Any,
        config_digest: Optional[str] = None,
    ) -> None:
        """Store a forecast result in cache."""

        key = self._make_key(dataset_hash, model_version, horizon, config_digest)
        with self._lock:
            self._store[key] = CacheEntry(value=value, created_at=datetime.now(timezone.utc))

    def purge_expired(self) -> int:
        """Remove expired entries and return the number purged."""

        removed = 0
        with self._lock:
            for key in list(self._store.keys()):
                entry = self._store[key]
                if entry.is_expired(self.ttl_seconds):
                    del self._store[key]
                    removed += 1
        return removed
