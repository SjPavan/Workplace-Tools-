import hmac
import logging
from base64 import urlsafe_b64encode
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from typing import Optional, Tuple

from ..config import get_settings

logger = logging.getLogger(__name__)


class StorageService:
    """Provides helper utilities for generating signed export URLs."""

    def __init__(self, signing_secret: str, ttl_seconds: int = 3600) -> None:
        self.signing_secret = signing_secret.encode("utf-8")
        self.ttl_seconds = ttl_seconds
        self.settings = get_settings()

    def sign_export(self, path: str) -> Optional[Tuple[str, datetime]]:
        base_url = self._base_url()
        if not base_url:
            logger.info("Supabase storage not configured; skipping signed URL")
            return None

        expires_at = datetime.now(timezone.utc) + timedelta(seconds=self.ttl_seconds)
        payload = f"{path}:{int(expires_at.timestamp())}".encode("utf-8")
        signature = hmac.new(self.signing_secret, payload, sha256).digest()
        token = urlsafe_b64encode(signature).decode("utf-8").rstrip("=")
        signed_url = f"{base_url}/{path}?expires={int(expires_at.timestamp())}&token={token}"
        return signed_url, expires_at

    def _base_url(self) -> Optional[str]:
        settings = self.settings
        if not settings.supabase_project_url or not settings.supabase_storage_bucket:
            return None
        return f"{settings.supabase_project_url}/storage/v1/object/public/{settings.supabase_storage_bucket}"
