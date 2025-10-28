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

1. Review the [architecture overview](docs/architecture.md) to understand how responsibilities are divided across workspaces.
2. Install the repo tooling:
   ```bash
   pip install pre-commit
   pre-commit install
   ```
3. Use the shared scripts as placeholders for future automation:
   - `./scripts/lint.sh` – add linting commands as they become available.
   - `./scripts/test.sh` – add unit and integration test commands.

## Contribution Workflow

1. Create a feature branch and implement changes within the appropriate workspace.
2. Update documentation under `docs/` when service boundaries or behaviors evolve.
3. Run the shared lint and test scripts locally, expanding them as the stack grows.
4. Ensure `pre-commit` checks pass before opening a pull request.

The legacy HTML utilities are preserved under `legacy/` for reference; new development should follow the monorepo architecture described above.
