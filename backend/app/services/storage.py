from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional

from ..utils.encryption import TokenEncryptor


@dataclass
class StoredTokens:
    encrypted_value: str


class GoogleTokenStore:
    """In-memory, encrypted storage for Google OAuth tokens per user."""

    def __init__(self, encryptor: TokenEncryptor) -> None:
        self._encryptor = encryptor
        self._store: Dict[str, StoredTokens] = {}

    def set_tokens(self, user_id: str, tokens: Dict[str, Any]) -> None:
        self._store[user_id] = StoredTokens(
            encrypted_value=self._encryptor.encrypt(tokens)
        )

    def get_tokens(self, user_id: str) -> Optional[Dict[str, Any]]:
        stored = self._store.get(user_id)
        if not stored:
            return None
        return self._encryptor.decrypt(stored.encrypted_value)

    def remove_tokens(self, user_id: str) -> None:
        self._store.pop(user_id, None)


class DeviceRegistry:
    """Tracks refresh tokens registered per device."""

    def __init__(self) -> None:
        self._registry: Dict[str, str] = {}

    def register_device(self, device_id: str, refresh_token: str) -> None:
        self._registry[device_id] = refresh_token

    def get_refresh_token(self, device_id: str) -> Optional[str]:
        return self._registry.get(device_id)
