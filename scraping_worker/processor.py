"""Core processing loop for the scraping worker service."""

from __future__ import annotations

import asyncio
import logging
from typing import Optional

from .browser import BrowserSession, run_custom_scripts
from .config import WorkerConfig
from .exporters import DatasetExporter
from .extractors import extract_records
from .jobs import JobState, JobStatus, ScrapingJob
from .queue import JobQueue, RedisJobQueue
from .storage import InMemorySupabaseStorageClient, StorageClient, SupabaseStorageClient

LOGGER = logging.getLogger(__name__)


class ScrapingWorker:
    """Consume jobs from a queue, scrape with Playwright, and persist the results."""

    def __init__(
        self,
        config: WorkerConfig,
        queue: Optional[JobQueue] = None,
        storage_client: Optional[StorageClient] = None,
    ) -> None:
        self._config = config
        self._queue = queue or RedisJobQueue(config.redis_url, config.redis_queue)
        if storage_client is not None:
            self._storage = storage_client
        elif config.supabase_enabled:
            self._storage = SupabaseStorageClient(config)
        else:
            self._storage = InMemorySupabaseStorageClient()
        self._browser = BrowserSession(config)
        self._stopping = asyncio.Event()

    async def run_forever(self, poll_interval: float = 0.5) -> None:
        """Continuously poll the queue for new jobs."""

        LOGGER.info("Scraping worker started; listening on queue '%s'", self._config.redis_queue)
        while not self._stopping.is_set():
            job = await self._queue.dequeue(timeout=1)
            if job is None:
                await asyncio.sleep(poll_interval)
                continue
            try:
                await self.process_job(job)
            except Exception as exc:  # pragma: no cover - logging path
                LOGGER.exception("Job %s failed: %s", job.id, exc)

    async def stop(self) -> None:
        self._stopping.set()
        await self._queue.close()

    async def process_job(self, job: ScrapingJob) -> JobStatus:
        """Process a single job and return the resulting status."""

        running_status = JobStatus(job_id=job.id, state=JobState.RUNNING, metadata=job.metadata)
        await self._storage.update_status(running_status)

        try:
            records = await self._run_scraping(job)
            exporter = DatasetExporter(records)
            artifacts = exporter.build(job.export_formats)
            uploaded = await self._storage.persist_dataset(job, artifacts)
            success = JobStatus(
                job_id=job.id,
                state=JobState.SUCCEEDED,
                stored_files=uploaded,
                metadata=job.metadata,
            )
            await self._storage.update_status(success)
            return success
        except Exception as exc:
            failure = JobStatus(
                job_id=job.id,
                state=JobState.FAILED,
                detail=str(exc),
                metadata=job.metadata,
            )
            await self._storage.update_status(failure)
            raise

    async def _run_scraping(self, job: ScrapingJob):
        async with self._browser.page() as page:
            await self._browser.navigate(page, job.url, job.wait_for_selector)
            if job.custom_scripts:
                await run_custom_scripts(page, job.custom_scripts)
            return await extract_records(page, job)
