import base64
import hashlib
import json
from typing import Any, Dict

from cryptography.fernet import Fernet, InvalidToken


class TokenEncryptor:
    """Encrypts and decrypts token payloads using Fernet symmetric encryption."""

    def __init__(self, secret: str) -> None:
        if not secret:
            raise ValueError("Encryption secret must be provided")
        key = hashlib.sha256(secret.encode("utf-8")).digest()
        self._fernet = Fernet(base64.urlsafe_b64encode(key))

    def encrypt(self, payload: Dict[str, Any]) -> str:
        raw = json.dumps(payload).encode("utf-8")
        return self._fernet.encrypt(raw).decode("utf-8")

    def decrypt(self, token: str) -> Dict[str, Any]:
        try:
            decrypted = self._fernet.decrypt(token.encode("utf-8"))
        except InvalidToken as exc:  # pragma: no cover - defensive programming
            raise ValueError("Failed to decrypt token payload") from exc
        return json.loads(decrypted.decode("utf-8"))
