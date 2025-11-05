# Workplace Tools – Notification Pipeline

This repository now includes a lightweight notification micro-module that wires
together proactive reminders, scraping job completions, and other automation
signals. Messages are delivered via Firebase Cloud Messaging (FCM) with a
Supabase Edge Function fallback for email, all while respecting per-user
subscription preferences and persisting delivery logs for auditing.

## Key features

- **FCM integration** for mobile and web push delivery (legacy HTTP endpoint).
- **Topic & user targeting** support with intelligent defaults for proactive
  reminders and scraping completion events.
- **User opt-in enforcement** via a JSON-backed preference store.
- **Delivery observability** through NDJSON log files persisted under `data/`.
- **Supabase fallback email** adapter so opted-out or failed pushes still reach
  the user’s inbox.

## Getting started

1. Export the required environment variables (see the full guide below):

   ```bash
   export FCM_SERVER_KEY="..."           # leave unset for dry-run mode
   export SUPABASE_URL="https://..."     # optional email fallback
   export SUPABASE_SERVICE_ROLE_KEY="..." # optional email fallback
   ```

2. Run the sample harness to exercise the full pipeline end-to-end:

   ```bash
   node scripts/runSampleNotification.js
   ```

   The script prints push + fallback outcomes and writes delivery logs to
   `data/delivery-log.ndjson`.

3. Embed `notifications/` into your proactive engine, scraping workers, or cron
   reminders:

   ```js
   const { NotificationPipeline } = require('./notifications');
   const pipeline = new NotificationPipeline();

   pipeline.handleEvent({
     type: 'scraping-job-complete',
     userId: 'user-id',
     title: 'Scraping job finished',
     body: 'Review the new leads',
     fallbackEmail: {
       to: 'user@example.com',
       subject: '[Scraper] Job finished',
       body: 'Open the dashboard to review the import.'
     },
   });
   ```

## Documentation

Detailed configuration notes, environment variable expectations, and local
validation steps are documented in
[`docs/notifications/fcm-setup.md`](docs/notifications/fcm-setup.md).

## Repository hygiene

- Runtime delivery artifacts are stored in `data/`. The directory ships with a
  `.gitkeep` file; log files themselves are ignored via `.gitignore`.
- No external dependencies are required – the module relies solely on Node.js
  core libraries.
