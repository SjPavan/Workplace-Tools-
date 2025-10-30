#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKIP_INSTALL=0
SKIP_MIGRATIONS=0

usage() {
  cat <<'EOF'
Usage: ./scripts/bootstrap.sh [options]

Set up a local development environment. By default this script copies .env files, installs dependencies, and applies database migrations.

Options:
  -h, --help            Show this help text and exit
  --skip-install        Skip dependency installation
  --skip-migrations     Skip Alembic migrations
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --skip-install)
      SKIP_INSTALL=1
      shift
      ;;
    --skip-migrations)
      SKIP_MIGRATIONS=1
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

echo "Bootstrapping local environment from $ROOT_DIR"

make -C "$ROOT_DIR" setup

if [[ "$SKIP_INSTALL" -eq 0 ]]; then
  make -C "$ROOT_DIR" install
else
  echo "Skipping dependency installation (--skip-install)."
fi

if [[ "$SKIP_MIGRATIONS" -eq 0 ]]; then
  if command -v alembic >/dev/null 2>&1; then
    make -C "$ROOT_DIR" db-migrate || {
      echo "Alembic migrations failed; resolve the error and rerun." >&2
      exit 1
    }
  else
    echo "Alembic not found; skipping migrations."
  fi
else
  echo "Skipping database migrations (--skip-migrations)."
fi

echo "Bootstrap complete."
