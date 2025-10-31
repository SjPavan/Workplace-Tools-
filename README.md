# Workplace Tools Backend

This service exposes authentication and calendar-sync APIs backed by Supabase Auth and Google OAuth. It consolidates login flows, device registration, and calendar token management so that the front-end utilities can rely on a single secure backend.

## Key Features

- **Supabase email/password authentication** with session persistence.
- **Google OAuth** login via Supabase session exchange.
- **Device token registration** and refresh token exchange for long-lived sessions.
- **RBAC enforcement** for `user` and `admin` roles on protected routes.
- **Google Calendar OAuth token exchange** and event retrieval with secure token storage.
- Comprehensive **automated tests** validating login, refresh, RBAC, and Google Calendar flows using mocked Supabase and Google clients.

## Project Structure

```
src/
  app.js                 Express app wiring
  server.js              Application entrypoint
  middleware/auth.js     Authentication & RBAC helpers
  routes/
    auth.js              Authentication, session, and device endpoints
    calendar.js          Google Calendar OAuth & events
  services/
    supabaseService.js   Supabase client factory
    sessionStore.js      In-memory session persistence
    deviceRegistry.js    Device token management
    calendarService.js   Google Calendar helpers
    googleTokenStore.js  Google OAuth token storage
  utils/
    hash.js              Token hashing helpers

tests/
  auth.test.js           Jest + Supertest coverage for core flows
```

## Environment Variables

Create a `.env` file (or export variables in your shell) before running the server:

| Variable | Description |
| -------- | ----------- |
| `PORT` | Port the Express server should listen on (default `3000`). |
| `SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_ANON_KEY` | Public anon key (or service role key). |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional – overrides the anon key for server-side operations. |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID configured for calendar access. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret. |

> ⚠️ Production deployments must persist Supabase sessions, device tokens, and Google credentials in a secure database or secrets manager. The in-memory stores in this repo are for local development and automated testing only.

## Local Development

1. Install dependencies and run the server:
   ```bash
   npm install
   npm start
   ```

2. Exercise endpoints with your API client of choice:
   - `POST /auth/login/email`
   - `POST /auth/login/google`
   - `POST /auth/session/refresh`
   - `POST /auth/session/exchange`
   - `POST /auth/device/register`
   - `GET /auth/me`
   - `GET /protected`
   - `GET /admin/reports`
   - `POST /calendar/oauth/google`
   - `GET /calendar/events`

## Automated Tests & Mock Strategy

The Jest suite (`npm test`) provides high-confidence coverage without requiring external services:

- **Supabase Auth** calls are executed against an injected mock client built with Jest spies. Each test configures the mock’s responses to assert the expected request payloads and session handling.
- **Google APIs** are replaced via `jest.spyOn` over the calendar service so that OAuth token exchange and calendar listing can be validated without real network calls.

This strategy keeps feedback fast while guaranteeing that the backend issues the correct calls, persists session state, and enforces RBAC.
