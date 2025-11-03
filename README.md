# Workplace Tools

This repository contains a collection of lightweight productivity utilities alongside a modern FastAPI backend foundation powered by Poetry, Supabase helpers, and pytest-based test coverage.

- The original HTML utilities remain available as standalone files in the repository root.
- The backend lives under [`backend/`](backend/) with its own README explaining setup, testing, and deployment considerations.

### Quickstart

```bash
cd backend
poetry install
poetry run uvicorn app.main:app --reload
```

Copy [`backend/.env.example`](backend/.env.example) to `.env` and adjust the values to suit your Supabase project and PostgreSQL connection details.
