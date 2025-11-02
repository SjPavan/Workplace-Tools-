# Workplace Tools Monorepo Scaffold

This repository provides the foundation for evolving the original standalone HTML utilities into a fully fledged multi-surface platform. The goal is to keep all services, clients, and infrastructure definitions co-located while sharing tooling and operational standards.

## Repository Structure

- **backend/** – backend APIs and domain services
- **worker/** – asynchronous workers, cron jobs, and background processors
- **web/** – browser-based user interfaces
- **mobile/** – native or cross-platform mobile applications
- **docs/** – shared documentation, including the [architecture overview](docs/architecture.md)
- **infra/** – infrastructure-as-code, deployment automation, and environment definitions
- **scripts/** – shared developer tooling (linting, testing, code generation)
- **legacy/** – archived HTML utilities retained for reference

## Getting Started

### Quick Start

1. **Bootstrap your development environment:**
   ```bash
   ./scripts/bootstrap.sh
   ```

2. **Install dependencies across all workspaces:**
   ```bash
   make install
   ```

3. **Start development servers:**
   ```bash
   # Terminal 1: Backend API
   make run-backend
   
   # Terminal 2: Web frontend
   make run-web
   ```

4. **Run tests and linting:**
   ```bash
   make lint    # Run linting for all workspaces
   make test    # Run tests for all workspaces
   make format  # Format code across all workspaces
   ```

### Detailed Setup

1. Review the [architecture overview](docs/architecture.md) to understand how responsibilities are divided across workspaces.
2. Install the repo tooling:
   ```bash
   pip install pre-commit
   pre-commit install
   ```
3. Set up environment files:
   ```bash
   make setup  # Creates .env files from templates
   ```

## Development Workflow

### Available Commands

The repository includes a comprehensive `Makefile` with the following targets:

```bash
make help           # Show all available targets
make setup          # Create .env files from templates
make install        # Install dependencies for all workspaces
make lint           # Run linting (ruff/flake8 for Python, eslint for JS/TS)
make test           # Run tests (pytest for Python, jest for JS/TS)
make format         # Format code (black/isort for Python, prettier for JS/TS)
make run-backend    # Start backend server (uvicorn)
make run-web        # Start web dev server (Next.js)
make run-worker     # Start worker processes
make db-migrate     # Run database migrations (alembic)
make clean          # Clean up temporary files and caches
```

### Scripts

- `./scripts/bootstrap.sh` – Comprehensive setup script for new developers
- `./scripts/checks.sh` – CI-ready validation script
- `./scripts/lint.sh` – Workspace-aware linting pipeline
- `./scripts/test.sh` – Cross-workspace test runner

### Environment Setup

The setup process creates environment files in each workspace:

- **Root:** `.env` (shared configuration)
- **Backend:** `backend/.env` (API settings, database URLs)
- **Web:** `web/.env.local` (frontend configuration, API endpoints)
- **Mobile:** `mobile/.env` (mobile-specific settings)

Create `.env.example` files in each workspace to define required variables.

## Contribution Workflow

1. **Set up your environment:**
   ```bash
   ./scripts/bootstrap.sh
   ```

2. **Create a feature branch** and implement changes within the appropriate workspace.

3. **Run validation locally:**
   ```bash
   make lint    # Check code style
   make test    # Run tests
   make format  # Format code before commit
   ```

4. **Run comprehensive checks:**
   ```bash
   ./scripts/checks.sh  # CI-ready validation
   ```

5. **Update documentation** under `docs/` when service boundaries or behaviors evolve.

6. **Ensure `pre-commit` checks pass** before opening a pull request.

### CI/CD Integration

The `./scripts/checks.sh` script is designed for CI environments and provides:
- Workspace validation
- Syntax checking
- Dependency verification
- Tool availability checks

Use this script in your CI pipeline to ensure consistent quality checks across environments.

---

The legacy HTML utilities are preserved under `legacy/` for reference; new development should follow the monorepo architecture described above.
