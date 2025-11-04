"""Storage abstractions for persisting scraped datasets."""

from __future__ import annotations

import asyncio
import json
from io import BytesIO
from typing import Dict

from .config import WorkerConfig
from .jobs import JobStatus, ScrapingJob

try:  # pragma: no cover - optional dependency
    from supabase import create_client
except Exception:  # pragma: no cover
    create_client = None  # type: ignore


class StorageError(RuntimeError):
    """Raised when persisting artifacts fails."""


class StorageClient:
    """Protocol-like base class for storage implementations."""

    async def persist_dataset(self, job: ScrapingJob, artifacts: Dict[str, tuple[bytes, str]]) -> Dict[str, str]:  # pragma: no cover - interface
        raise NotImplementedError

    async def update_status(self, status: JobStatus) -> None:  # pragma: no cover - interface
        raise NotImplementedError


class SupabaseStorageClient(StorageClient):
    """Upload artifacts and job statuses to a Supabase storage bucket."""

    def __init__(self, config: WorkerConfig) -> None:
        if not config.supabase_enabled:
            raise ValueError("Supabase configuration missing; cannot instantiate SupabaseStorageClient")
        if create_client is None:
            raise RuntimeError("supabase package is required but not installed")
        self._bucket = config.supabase_bucket
        self._client = create_client(config.supabase_url, config.supabase_key)

    async def persist_dataset(self, job: ScrapingJob, artifacts: Dict[str, tuple[bytes, str]]) -> Dict[str, str]:
        prefix = job.supabase_path_prefix or job.id
        uploaded: Dict[str, str] = {}
        for fmt, (payload, content_type) in artifacts.items():
            path = f"{prefix}/{job.id}.{fmt}"
            await asyncio.to_thread(self._upload_sync, path, payload, content_type)
            uploaded[fmt] = path
        return uploaded

    async def update_status(self, status: JobStatus) -> None:
        path = f"{status.job_id}/status.json"
        data = json.dumps(status.to_dict(), ensure_ascii=False, indent=2).encode("utf-8")
        await asyncio.to_thread(self._upload_sync, path, data, "application/json")

    def _upload_sync(self, path: str, payload: bytes, content_type: str) -> None:
        file_obj = BytesIO(payload)
        file_obj.seek(0)
        response = self._client.storage.from_(self._bucket).upload(
            path,
            file_obj,
            {"content-type": content_type, "upsert": True},
        )
        if isinstance(response, dict) and response.get("error"):
            raise StorageError(str(response["error"]))


class InMemorySupabaseStorageClient(StorageClient):
    """In-memory storage used for unit tests and local development."""

    def __init__(self) -> None:
        self.uploads: Dict[str, bytes] = {}
        self.statuses: Dict[str, JobStatus] = {}

    async def persist_dataset(self, job: ScrapingJob, artifacts: Dict[str, tuple[bytes, str]]) -> Dict[str, str]:
        prefix = job.supabase_path_prefix or job.id
        stored: Dict[str, str] = {}
        for fmt, (payload, _content_type) in artifacts.items():
            path = f"{prefix}/{job.id}.{fmt}"
            self.uploads[path] = payload
            stored[fmt] = path
        return stored

    async def update_status(self, status: JobStatus) -> None:
        self.statuses[status.job_id] = status
