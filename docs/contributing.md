# Contributing

Thanks for taking the time to improve Workplace-Tools! This project collects a set of standalone HTML utilities, so small, focused changes are welcome.

## Development workflow

1. Create a feature branch from `main`.
2. Implement the change and keep commits focused.
3. Install development tooling with `python -m pip install -r requirements-dev.txt`. JavaScript tooling is executed with `npx` in CI, so no local installation is required.
4. Run the local equivalents of our CI workflows before opening a pull request:
   - `Backend CI`: `flake8`, `black --check`, `isort --check-only`, and `pytest`.
   - `Web CI`: `eslint`, `prettier --check`, `jest --passWithNoTests`, and the Playwright placeholder run.
5. Open a pull request using the provided template and fill in the testing checklist.
6. Request a review from the code owners (`@SjPavan`).

## Branch protection and required checks

The `main` branch is protected. Pull requests must:

- Be up to date with the latest `main` branch.
- Have the **Backend CI** and **Web CI** GitHub Actions workflows green.
- Pass status checks for linting, formatting, and automated tests before merging.
- Receive at least one approving review from the code owners.

Following these guardrails helps us keep the project stable and maintainable.
