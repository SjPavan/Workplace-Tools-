import pytest

from scraping_worker.config import WorkerConfig
from scraping_worker.jobs import ExtractionType, JobState, ScrapingJob
from scraping_worker.processor import ScrapingWorker
from scraping_worker.queue import InMemoryJobQueue
from scraping_worker.storage import InMemorySupabaseStorageClient


@pytest.mark.asyncio
async def test_process_job_success(monkeypatch):
    config = WorkerConfig()
    storage = InMemorySupabaseStorageClient()
    worker = ScrapingWorker(config, queue=InMemoryJobQueue(), storage_client=storage)

    job = ScrapingJob(
        id="job-1",
        url="https://example.com",
        extraction_type=ExtractionType.ARTICLE,
        export_formats=["json", "csv"],
    )

    async def fake_run_scraping(arg):
        assert arg is job
        return [{"title": "Example", "content": "Body"}]

    monkeypatch.setattr(worker, "_run_scraping", fake_run_scraping)

    status = await worker.process_job(job)

    assert status.state == JobState.SUCCEEDED
    assert status.stored_files == {"json": "job-1/job-1.json", "csv": "job-1/job-1.csv"}
    assert storage.uploads["job-1/job-1.json"].startswith(b"[")
    assert storage.statuses[job.id].state == JobState.SUCCEEDED


@pytest.mark.asyncio
async def test_process_job_failure(monkeypatch):
    config = WorkerConfig()
    storage = InMemorySupabaseStorageClient()
    worker = ScrapingWorker(config, queue=InMemoryJobQueue(), storage_client=storage)

    job = ScrapingJob(
        id="job-2",
        url="https://example.com",
        extraction_type=ExtractionType.TABLE,
        export_formats=["json"],
    )

    async def fake_run_scraping(_):
        raise RuntimeError("boom")

    monkeypatch.setattr(worker, "_run_scraping", fake_run_scraping)

    with pytest.raises(RuntimeError):
        await worker.process_job(job)

    assert storage.statuses[job.id].state == JobState.FAILED
    assert storage.statuses[job.id].detail == "boom"
