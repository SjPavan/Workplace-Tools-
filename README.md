# Workplace Tools Data Platform

This repository now includes a complete PostgreSQL data model for the workplace tools suite, backed by SQLAlchemy models and Alembic migrations. The schema covers users, devices, calendars, tasks, routines, habits, mood tracking, projects, research assets, scraping pipelines, AI interaction logs, financial data, analytics snapshots, and notification preferences.

## Repository Structure

```
app/
  database.py            # SQLAlchemy base metadata and naming conventions
  models/                # Domain model definitions
    __init__.py
    schemas.py
alembic/
  env.py                 # Alembic configuration loading SQLAlchemy metadata
  versions/              # Versioned migration scripts
README.md                # Setup and deployment instructions
requirements.txt         # Python dependencies for the database stack
docs/
  er_diagram.md          # Entity relationship diagram (Mermaid)
```

## Prerequisites

- Python 3.10+
- `pip` for package installation
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase`)
- Access to a Supabase project (for remote deployments)

Install Python dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Environment Configuration

Alembic reads the database URL from the following environment variables (in order):

1. `DATABASE_URL`
2. `SUPABASE_DB_URL`
3. The fallback URL defined in `alembic.ini`

For Supabase connections, use the full Postgres connection string from **Project Settings → Database → Connection string → URI**. Example:

```bash
export SUPABASE_DB_URL="postgresql+psycopg://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"
```

## Running Migrations Locally with Supabase

1. **Start the Supabase stack locally** (includes Postgres at port `54322`):
   ```bash
   supabase start
   ```
2. **Export the local database URL**:
   ```bash
   export DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:54322/postgres"
   ```
3. **Apply the latest migrations**:
   ```bash
   alembic upgrade head
   ```
4. (Optional) Inspect the schema:
   ```bash
   psql "$DATABASE_URL" -c "\dt"
   ```

When you are done, stop the local stack with `supabase stop`.

## Deploying to a Hosted Supabase Project

1. **Authenticate the CLI** (one-time):
   ```bash
   supabase login
   ```
2. **Link the CLI to your Supabase project**:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
3. **Set the remote database URL** (pulled from the Supabase dashboard):
   ```bash
   export SUPABASE_DB_URL="postgresql+psycopg://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"
   ```
4. **Run Alembic against the remote database**:
   ```bash
   alembic upgrade head
   ```
5. **Verify the schema** using the Supabase Dashboard or with:
   ```bash
   supabase db remote commit
   ```
   (The command records the current remote state as a Supabase migration snapshot.)

## Managing Future Schema Changes

1. Update or add SQLAlchemy models in `app/models/schemas.py`.
2. Autogenerate a migration (ensure the correct `DATABASE_URL`/`SUPABASE_DB_URL` is set):
   ```bash
   alembic revision --autogenerate -m "describe your change"
   alembic upgrade head
   ```
3. Commit both the model changes and the generated migration under `alembic/versions/`.

## Data Model Overview

A Mermaid ER diagram summarising the schema is available at `docs/er_diagram.md`. View it on GitHub or any Mermaid renderer to inspect entity relationships, key constraints, and indexing strategy (including task scheduling and scraping job execution indexes).

## Supabase Specific Notes

- The initial migration enables the `pgcrypto` extension to support `gen_random_uuid()`.
- Scheduling-critical indexes are present on task start/due timestamps and scraping job status/next-run timestamps to optimise automation workloads.
- All tables use UTC-aware timestamps and JSONB columns for flexible metadata storage compatible with Supabase.

## Support

For additional context on Supabase CLI workflows, refer to the [Supabase database migration docs](https://supabase.com/docs/guides/database). For Alembic usage, see the [official documentation](https://alembic.sqlalchemy.org/).
