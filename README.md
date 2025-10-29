# Workplace Tools

This repository aggregates utilities used across the workplace, including:

- Stand-alone HTML helpers for formatting and title case conversions.
- A FastAPI backend that integrates Supabase authentication and Google Calendar synchronisation.

## Backend Overview

The backend source lives under `backend/` and exposes endpoints for:

- Exchanging Supabase sessions, refreshing tokens, and registering devices.
- Role-protected routes (user/admin) using Supabase JWTs.
- Google Calendar OAuth connect/disconnect flows and a sample sync job.

Please read [README-auth.md](README-auth.md) for detailed setup instructions covering
Supabase, Google OAuth credentials, environment variables, and local development.

Generated API documentation is available at `http://localhost:8000/docs` when the backend is running.
