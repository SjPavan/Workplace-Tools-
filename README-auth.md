# Authentication & Calendar Sync Setup

This guide describes how to configure the FastAPI backend with Supabase Auth and Google Calendar integration.

## Prerequisites

- Python 3.11+
- A Supabase project
- Google Cloud project with Calendar API enabled

## 1. Configure Supabase Auth

1. Create a Supabase project (https://supabase.com/).
2. In **Authentication → Providers**, enable **Email** and **Google** providers.
3. Under **Authentication → URL Configuration**, add the backend redirect URI used after Google sign-in, e.g. `https://localhost:8000/google/callback`.
4. Copy the **Project URL** and **anon public API key**. Add them to your `.env` file as `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
5. (Optional) Obtain a Service Role key if you intend to call administrative APIs and set `SUPABASE_SERVICE_ROLE_KEY`.
6. Create a `user` and `admin` role in your Supabase JWT custom claims (App Settings → API → JWT Custom Claims) or manage them through your auth hook. The backend expects `app_metadata.role` to contain either `user` or `admin`.

## 2. Configure Google OAuth

1. Visit https://console.cloud.google.com/apis/credentials.
2. Create an **OAuth 2.0 Client ID** (type "Web application").
3. Add the following authorized redirect URIs:
   - `https://localhost:8000/google/callback`
   - Any additional environments you plan to use.
4. Enable the **Google Calendar API** in the API Library.
5. Download the client credentials and populate your `.env` file with:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
6. Ensure the same redirect URI is used by your frontend to complete the OAuth flow.

## 3. Environment Variables

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Set the following variables:

- `SUPABASE_URL` – Supabase project URL.
- `SUPABASE_ANON_KEY` – Supabase public anon key.
- `SUPABASE_SERVICE_ROLE_KEY` – Optional service role key.
- `GOOGLE_CLIENT_ID` – OAuth client ID from Google.
- `GOOGLE_CLIENT_SECRET` – OAuth client secret.
- `REDIRECT_URI` – Backend redirect URI used in OAuth flows.
- `ENCRYPTION_SECRET` – Passphrase to encrypt Google tokens (32+ characters recommended).

## 4. Local Development

Install dependencies and run the API:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.app.main:app --reload
```

The API will be available at `http://localhost:8000`. Visit `http://localhost:8000/docs` for the automatically generated OpenAPI documentation showing the new endpoints.

## 5. Testing

Run the mocked integration tests:

```bash
cd backend
pytest
```

The test suite covers:

- Supabase session exchanges and error handling.
- Role-protected routes enforcing `user` vs `admin` access.
- Google Calendar connect/disconnect flows and a sample calendar synchronisation job using mocked Google APIs.

## 6. OAuth Redirect Flow (Overview)

1. The frontend initiates Supabase Auth by obtaining a session (email/password or Google sign-in).
2. The frontend sends the Supabase tokens to `/auth/session/exchange`.
3. Authenticated requests include the Supabase `access_token` in the `Authorization` header.
4. To connect Google Calendar, the frontend completes the Google OAuth consent screen, receives the authorization code, and posts it to `/google/calendar/connect`.
5. The backend exchanges and stores Google tokens (encrypted) and can now perform sync operations such as `/google/calendar/calendars` or `/google/calendar/sync`.

Refer to the FastAPI documentation in `docs/` for extending the integration with additional routes or background jobs.
