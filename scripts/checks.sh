#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FORMAT_MODE="check"

usage() {
  cat <<'EOF'
Usage: ./scripts/checks.sh [options]

Run the standard lint, test, and formatting checks. Intended for CI pipelines but can also be used locally.

Options:
  -h, --help        Show this help message and exit
  --fix-format      Run formatting in "fix" mode instead of "check"
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --fix-format)
      FORMAT_MODE="fix"
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

export CI=1

make -C "$ROOT_DIR" lint
make -C "$ROOT_DIR" test
make -C "$ROOT_DIR" format FORMAT_MODE="$FORMAT_MODE"
