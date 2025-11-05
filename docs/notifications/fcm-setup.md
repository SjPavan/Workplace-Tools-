# Firebase Cloud Messaging notification pipeline

This repository ships a self-contained notification micro-module that coordinates
proactive reminders, scraping job completions, and ad-hoc alerts across push and
email channels. Firebase Cloud Messaging (FCM) is used for mobile and web push
delivery, while Supabase Edge Functions provide an email fallback.

The module persists delivery logs and enforces user opt-in preferences so that
push and email messages are only emitted when explicitly allowed.

## Directory layout

```
notifications/
  config.js                # Shared configuration loader (env-aware)
  pipeline.js              # Orchestrates the unified notification workflow
  fcm/fcmClient.js         # Lightweight FCM legacy HTTP API client
  storage/deliveryLogStore # Append-only NDJSON delivery log persistence
  storage/preferencesStore # JSON-backed channel + topic preference store
  supabase/emailFallback.js# Supabase Edge Function email fallback adapter
scripts/runSampleNotification.js # End-to-end harness for local validation
```

Runtime artifacts live under `data/` (delivery logs, fallback logs,
user preference store).

## 1. Configure Firebase Cloud Messaging

### Requirements

* Firebase project with Cloud Messaging enabled.
* A **server key** (legacy key) to authenticate server-to-server requests.
* Optional: a topic naming convention (configure via `FCM_TOPIC_PREFIX`).

### Steps

1. Open the Firebase console, select your project, and navigate to
   **Project settings → Cloud Messaging**.
2. In the *Cloud Messaging API (Legacy)* section copy the **Server key**. This
   key is used for legacy HTTP requests and is suitable for server-triggered
   pushes. Store it securely.
3. Populate the following environment variables locally (e.g. in `.env`):

   ```bash
   export FCM_SERVER_KEY="AAAA..."
   export FCM_PROJECT_ID="your-firebase-project"
   export FCM_SENDER_ID="your-sender-id"
   # Optional – prefix applied to inferred topics (e.g. proactive updates)
   export FCM_TOPIC_PREFIX="workplace-"
   ```

4. If you prefer to keep the integration in dry-run mode (skipping actual push
   requests), leave `FCM_SERVER_KEY` unset or explicitly provide
   `export FCM_DRY_RUN=true` via overrides.

The included `FCMClient` implementation currently targets the legacy HTTP API
(`https://fcm.googleapis.com/fcm/send`). OIDC-based HTTP v1 support can be added
later by swapping the client implementation.

### Topic & user targeting

* **User targeting** – supply `userId` + `token` or `tokens` when invoking the
  pipeline.
* **Topic targeting** – provide `topic` or rely on automatic topic inference:
  * `*reminder*` → `proactive-reminders` (configurable via `DEFAULT_REMINDER_TOPIC`).
  * `*scrape*` → `${FCM_TOPIC_PREFIX}scraping-complete`.
  * `*proactive*` → `${FCM_TOPIC_PREFIX}proactive-updates`.

## 2. Configure Supabase email fallback

When push delivery is skipped (user opt-out) or fails, the pipeline can use a
Supabase Edge Function to deliver an email.

1. Provision a Supabase project and create an Edge Function capable of handling
   the expected payload shape:

   ```json
   {
     "to": "person@example.com",
     "subject": "string",
     "body": "string",
     "metadata": {"eventType": "scraping-job-complete", ...}
   }
   ```

2. Collect the **Project URL** (e.g. `https://abc123.supabase.co`) and the
   **service role key**.
3. Export the following variables:

   ```bash
   export SUPABASE_URL="https://abc123.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY="sbp_service_role_..."
   export SUPABASE_EMAIL_FUNCTION_PATH="/functions/v1/send-email"
   ```

4. The adapter automatically logs every fallback invocation (or skip) to
   `data/email-fallback.log`.

If any of the Supabase values are missing the module will keep operating and
log that email delivery is disabled instead of throwing.

## 3. User opt-in preference store

User preferences are persisted to `data/user-preferences.json` and control
per-channel and per-topic delivery.

```json
{
  "user-pro": {
    "channels": {"push": true, "email": true},
    "topics": {
      "proactive-reminders": {"push": true, "email": true},
      "scraping-complete": {"push": false, "email": true}
    }
  },
  "user-silent": {
    "channels": {"push": false, "email": true}
  }
}
```

* `channels.push = false` ➝ all push notifications are skipped.
* `topics.scraping-complete.push = false` ➝ skip push for that topic only.
* Email preferences follow the same pattern.

Use `NotificationPipeline.recordUserPreference()` to update opt-ins at runtime.

## 4. Delivery logs

Delivery attempts are appended to `data/delivery-log.ndjson`. Each line is a
JSON record:

```json
{
  "timestamp": "2024-11-05T15:18:00.123Z",
  "eventId": "9a4f...",
  "eventType": "scraping-job-complete",
  "userId": "user-pro",
  "topic": "workplace-scraping-complete",
  "status": "success",
  "push": {"status": "success"},
  "fallback": null
}
```

You can query the store programmatically using
`NotificationPipeline.getDeliveryLogs({ userId, status, eventType })` or inspect
it manually.

## 5. Local end-to-end harness

Run the bundled script to exercise the full workflow end-to-end:

```bash
node scripts/runSampleNotification.js
```

The harness:

1. Instantiates the pipeline using environment configuration.
2. Emits three sample events (proactive reminder, scraping job completion,
   opt-out reminder).
3. Prints push + fallback outcomes for each event and the resulting delivery
   log summary.
4. Persists artifacts under `data/` for later inspection.

When `FCM_SERVER_KEY` is unset, push delivery runs in dry-run mode. This still
records the attempt and triggers the email fallback for opted-in users.

## 6. Integrating with upstream producers

The module can be embedded in the proactive engine, scraping worker service, or
any backend job:

```js
const { NotificationPipeline } = require('./notifications');

const pipeline = new NotificationPipeline();

async function onScrapeComplete(job) {
  await pipeline.handleEvent({
    type: 'scraping-job-complete',
    userId: job.ownerId,
    title: `Scraping job ${job.id} finished`,
    body: `${job.records} records processed`,
    data: { jobId: job.id },
    fallbackEmail: {
      to: job.ownerEmail,
      subject: `[Scraper] Job ${job.id} finished`,
      body: 'Review the results in the dashboard',
    },
  });
}
```

## 7. Security & deployment notes

* Keep server keys and service role keys outside version control. Use `.env`
  locally and your platform’s secret manager in production.
* Rotate keys periodically and update the environment variables accordingly.
* The data directory is ignored from version control for log files; copy the
  `.gitkeep` file to retain the folder when deploying containers.
* Upgrade to FCM HTTP v1 when you need advanced platform-specific overrides or
  per-device analytics. The pipeline was designed so you can swap
  `fcm/fcmClient.js` without touching orchestration logic.

## 8. Quick verification checklist

- [x] FCM environment variables configured (or dry-run acknowledged)
- [x] Supabase fallback variables provided (optional)
- [x] User preferences populated for target users
- [x] `node scripts/runSampleNotification.js` completes without unhandled errors
- [x] Delivery logs written to `data/delivery-log.ndjson`
- [x] Fallback email logs written (when applicable)

With these pieces in place, the proactive reminder and scraping job producers
can now trigger notifications confidently while respecting user consent and
recording delivery outcomes.
