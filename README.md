# Personal Productivity API

This project provides APIs for task management, routines, habits, time blocking, mood tracking, proactive scheduling, and daily summaries. It exposes REST endpoints backed by an in-memory store and includes a background job that generates morning summaries and queues suggestions.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the API:
   ```bash
   npm start
   ```
   The server listens on `http://localhost:3000` by default.

## Testing

Run the automated unit and integration test suite:

```bash
npm test
```

The tests exercise every endpoint, including scheduling computations and the morning summary job.

## API documentation

OpenAPI documentation for all endpoints is available at [`docs/openapi.yaml`](docs/openapi.yaml). Import the document into your preferred API client (e.g., Postman or Stoplight) to explore request/response schemas.

## Core endpoints

- **Tasks & Subtasks**: `/tasks`, `/tasks/{taskId}`, `/tasks/{taskId}/subtasks`
- **Routines**: `/routines`
- **Habits**: `/habits`
- **Time Blocking**: `/time-blocks`
- **Important Dates**: `/important-dates`
- **Mood Tracking**: `/moods`
- **Scheduling Engine**: `/scheduling/run`, `/reminders`, `/suggestions`
- **Daily Summary**: `/summary/daily`, `/summary/daily/{date}`, `/summary`
- **Background Job Trigger**: `/jobs/morning-summary/run`

Every collection supports CRUD operations, prioritization logic is available via `/tasks?prioritize=true`, and `POST /summary/daily` generates an on-demand summary for a specific date.

## Morning summary background job

A `MorningSummaryJob` instance is created with the application and, when the server is running, polls every minute to execute once after 07:00 local time. The job generates the day’s summary and queues scheduling suggestions. You can invoke it manually via the `/jobs/morning-summary/run` endpoint (a date can be supplied in the request body to backfill).

## Sample cron job

To run the morning summary and scheduling suggestions from system cron instead of the in-process scheduler, add the following entry (replace the host/port if necessary):

```
0 7 * * * curl -s -X POST http://localhost:3000/jobs/morning-summary/run > /dev/null
```

This triggers the same background workflow the API performs automatically each morning.
