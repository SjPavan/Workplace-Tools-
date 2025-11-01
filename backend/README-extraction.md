# Extraction API Backend

This service exposes CRUD and lifecycle APIs for managing scraping jobs and coordinating with the Playwright-based extraction worker. It is implemented with FastAPI and uses a Redis-backed queue plus optional schedule orchestration.

## Features

- Job management endpoints under `/extract` for creating, listing, updating, and retrieving jobs.
- On-demand job run triggering with queue publication for the worker.
- Worker webhook to report run progress and persist artifacts.
- Signed export URL generation for Supabase Storage deliveries.
- Optional recurring scheduling backed by APScheduler.
- Notification hooks for downstream delivery (stubbed topic interface).

## Local Development

### Prerequisites

- Python 3.11+
- Redis instance (local or Upstash) for queue dispatching. Optional for basic development.
- Supabase project (or any object storage) for hosting export artifacts. Optional during development; signing can be bypassed by leaving the project URL unset.

### Installation

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Environment Variables

Copy `.env.example` to `.env` and update the values:

- `DATABASE_URL` – SQLAlchemy connection string (defaults to SQLite file).
- `REDIS_URL` – Upstash or self-hosted Redis URL (`rediss://` strongly recommended).
- `REDIS_QUEUE_NAME` – Queue channel for worker dispatch (`extract.jobs`).
- `SUPABASE_PROJECT_URL` – Base URL of your Supabase project (e.g. `https://xyz.supabase.co`).
- `SUPABASE_STORAGE_BUCKET` – Bucket containing export artifacts.
- `EXPORT_SIGNING_SECRET` – Secret used to sign download tokens.
- `EXPORT_URL_TTL_SECONDS` – Signed URL expiration in seconds (default: 3600).
- `SCHEDULER_ENABLED` – Toggle recurring schedules (true/false).
- `SCHEDULER_TIMEZONE` – Timezone passed to APScheduler (default: `UTC`).

### Running the API

```bash
uvicorn app.main:app --reload --port 8000 --app-dir backend
```

FastAPI automatically exposes the OpenAPI documentation at `http://localhost:8000/docs`.

### Example Flow

1. **Create a job**
   ```bash
   curl -X POST http://localhost:8000/extract/jobs \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Product scrape",
       "target_urls": ["https://example.com/products"],
       "selectors": {"title": "h1", "price": ".price"},
       "schedule_cron": "0 2 * * *",
       "export_formats": ["csv", "json"]
     }'
   ```

2. **Trigger an on-demand run**
   ```bash
   curl -X POST http://localhost:8000/extract/jobs/1/run
   ```

3. **Simulate worker callback**
   ```bash
   curl -X POST http://localhost:8000/extract/hooks/worker-callback \
     -H "Content-Type: application/json" \
     -d '{
       "run_id": 1,
       "status": "succeeded",
       "progress": 100,
       "artifacts": [
         {"export_format": "csv", "storage_path": "jobs/1/runs/1/export.csv"}
       ]
     }'
   ```

4. **Fetch signed exports**
   ```bash
   curl http://localhost:8000/extract/jobs/1/exports
   ```

If Supabase configuration is present the API will return signed URLs that expire after the configured TTL.

## Scheduling

Recurring schedules rely on APScheduler. On startup, the application loads any jobs that define a `schedule_cron` value with a valid cron expression. In production you can run the API with scheduling enabled and point it to a managed Redis/Upstash instance. For free-tier Upstash deployments, use a single queue (`extract.jobs`) and keep schedules lightweight to remain within rate limits.

If you prefer to delegate scheduling to Celery beat, implement a companion service that publishes identical queue messages to the worker; the API keeps the queue abstraction behind `services.queue.JobQueue`.

## Queue Abstraction

`JobQueue` defines a simple `enqueue_job_run(job, run)` interface with two implementations:

- `RedisJobQueue` – pushes JSON messages to Redis via `RPUSH` (Upstash compatible).
- `InMemoryJobQueue` – used for tests and local development without Redis.

Workers should subscribe to the configured queue, deserialize the payload, and process the scrape according to the provided selectors and export formats.

## Architecture Overview

```
Client -> FastAPI (/extract) -> Database (SQLAlchemy ORM)
                             -> JobQueue (Redis / Upstash)
                             -> Scheduler (APScheduler) -- cron to JobQueue
                             -> NotificationBus (stub topic for FCM)
                             -> StorageService (Supabase signed URLs)
Worker (Playwright) -> POST /extract/hooks/worker-callback -> Database + Notifications
```

## Testing

Tests live in `backend/tests` and can be executed with:

```bash
pytest backend/tests
```

The test suite uses an in-memory SQLite database and the in-memory queue implementation, making it independent of external services.
