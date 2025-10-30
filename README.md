# Workplace Tools Monorepo

A collection of small utilities and demo apps maintained as a lightweight monorepo. The repository now exposes a shared Makefile and reusable scripts so everyday development flows are consistent across backend, web, and mobile surfaces.

## Repository structure

- `backend/` – Python backend services (FastAPI, Alembic, workers, etc.)
- `web/` – Next.js web frontend
- `mobile/` – React Native / Expo mobile client
- `scripts/` – Shared shell utilities for local and CI automation
- `Makefile` – Entry point for common developer tasks

> **Tip:** Not every project directory must exist. The Makefile gracefully skips steps when a component is absent.

## Getting started

1. Make sure you have the expected tooling installed (Python, Node.js, package managers like `poetry`, `pnpm`, `yarn`, or `npm`, plus `alembic`, `uvicorn`, etc.).
2. Bootstrap your environment:

   ```bash
   ./scripts/bootstrap.sh
   ```

   Use `--skip-install` or `--skip-migrations` if you only want to perform a subset of the bootstrap steps:

   ```bash
   ./scripts/bootstrap.sh --skip-migrations
   ```

## Everyday Makefile targets

| Target | Description |
| ------ | ----------- |
| `make setup` | Copy `.env.example` files to `.env` for backend, web, and mobile apps. |
| `make install` | Install dependencies for backend (`poetry`/`pip`), web (`pnpm`/`yarn`/`npm`), and mobile. |
| `make lint` | Run Python (ruff/flake8) and web (Next.js) linters. |
| `make test` | Execute backend `pytest` and web `jest` test suites. |
| `make format` | Format Python (Black + isort) and JavaScript/TypeScript (Prettier). Add `FORMAT_MODE=check` to run in CI check mode. |
| `make run-backend` | Start the backend API with `uvicorn`. Override `UVICORN_APP`, `UVICORN_HOST`, or `UVICORN_PORT` as needed. |
| `make run-web` | Launch the Next.js development server using the detected package manager. |
| `make run-worker` | Kick off the Playwright worker stub (`npx playwright test --project=worker`). |
| `make db-migrate` | Apply database migrations with Alembic (uses `backend/alembic.ini` when present). |

## CI / automation

The `scripts/checks.sh` helper bundles together the standard validation steps and is intended for reuse in CI pipelines:

```bash
./scripts/checks.sh
```

Pass `--fix-format` to allow Prettier/Black/isort to write changes instead of running in check mode inside CI:

```bash
./scripts/checks.sh --fix-format
```

## Formatting tips

- Run `make format FORMAT_MODE=check` locally to confirm formatting without modifying files.
- Use `make format` (or `./scripts/checks.sh --fix-format`) to apply automatic fixes across Python and JavaScript/TypeScript codebases.

Feel free to tailor the Makefile commands to match your project layout; the defaults are designed to work out-of-the-box with the common backend/web/mobile split.
