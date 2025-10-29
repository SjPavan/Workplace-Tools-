from dataclasses import dataclass

import pytest

from scraping_worker import WorkerConfig
from scraping_worker.cli import _cmd_submit_job
from scraping_worker.jobs import ExtractionType, JobState
from scraping_worker.processor import ScrapingWorker
from scraping_worker.queue import InMemoryJobQueue
from scraping_worker.storage import InMemorySupabaseStorageClient


@dataclass
class _ProxyQueue:
    backend: InMemoryJobQueue

    async def enqueue(self, job):
        await self.backend.enqueue(job)

    async def close(self):
        return None


@pytest.mark.asyncio
async def test_cli_submission_results_in_persisted_dataset(monkeypatch):
    config = WorkerConfig()
    storage = InMemorySupabaseStorageClient()
    shared_queue = InMemoryJobQueue()

    worker = ScrapingWorker(config, queue=shared_queue, storage_client=storage)

    async def fake_run_scraping(job):
        return [
            {"title": "Row 1", "content": "Example"},
            {"title": "Row 2", "content": "More"},
        ]

    monkeypatch.setattr(worker, "_run_scraping", fake_run_scraping)

    monkeypatch.setattr("scraping_worker.cli.RedisJobQueue", lambda *args, **kwargs: _ProxyQueue(shared_queue))

    payload = {
        "id": "integration-job",
        "url": "https://example.com/article",
        "extraction_type": ExtractionType.ARTICLE.value,
        "export_formats": ["json"],
    }

    job = await _cmd_submit_job(config, payload)
    assert job.id == "integration-job"

    dequeued = await shared_queue.dequeue(timeout=1)
    assert dequeued.id == job.id

    await worker.process_job(dequeued)

    assert storage.statuses[job.id].state == JobState.SUCCEEDED
    assert "integration-job/integration-job.json" in storage.uploads
