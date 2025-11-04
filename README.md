# Workplace Tools

This repository now includes a Python-based scraping worker service designed for ingesting structured content from the web using Playwright-powered Chromium sessions.

## Scraping Worker Service

- **Technology**: Python Playwright with stealth hardening, rotating user agents, and configurable retry/backoff.
- **Queue**: Jobs are consumed from Redis. Each job specifies the target URL, extraction type (tables, articles, products, or custom scripts), and desired export formats.
- **Extraction**: Supports DOM selector-based extraction as well as custom JavaScript snippets executed in the page context.
- **Storage**: Scraped datasets are exported to JSON/CSV/Excel and uploaded to a Supabase storage bucket. Job statuses are also written back to Supabase.

## Running the Worker

1. Install the Python dependencies:

   ```bash
   pip install -r requirements.txt
   playwright install chromium
   ```

2. Configure environment variables (e.g. `REDIS_URL`, `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_BUCKET`).

3. Start the worker loop:

   ```bash
   python -m scraping_worker worker
   ```

4. Submit a job definition via the CLI:

   ```bash
   python -m scraping_worker submit path/to/job.json
   ```

   The CLI accepts JSON payloads compatible with the `ScrapingJob` schema defined in `scraping_worker/jobs.py`.

## Testing

Unit tests rely on mocked Playwright pages, in-memory queues, and storage backends. Execute them with:

```bash
pytest
```
