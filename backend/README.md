# Workplace Tools Backend

This directory contains the FastAPI backend that powers the Workplace Tools project. It provides a foundation for Supabase-integrated authentication, structured configuration, rate limiting, and health/version instrumentation.

## Getting Started

### Prerequisites

- Python 3.11+
- [Poetry](https://python-poetry.org/) for dependency management

### Installation

```bash
cd backend
poetry install
```

### Environment Variables

Copy the provided template and adjust the values for your environment:

```bash
cp .env.example .env
```

### Running the Application

```bash
poetry run uvicorn app.main:app --reload
```

The service exposes:

- `GET /health` for readiness checks
- `GET /version` for deployment metadata
- `GET /auth/me` for Supabase-authenticated user inspection

## Testing

Run the unit tests with:

```bash
poetry run pytest
```

## Docker

A development Dockerfile is included for local iteration:

```bash
docker build -t workplace-tools-backend ./backend
```

## Dev Container

A preconfigured Dev Container (`.devcontainer/devcontainer.json`) is available to bootstrap a VS Code remote container with Poetry and Python 3.11 ready to use.
