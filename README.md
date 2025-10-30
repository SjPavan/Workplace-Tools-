# Workplace Tools

A collection of standalone HTML utilities used in the workplace, including title-case conversion and a virtual browser mock. Each page is self-contained with vanilla HTML, CSS, and JavaScript.

## Getting started

Open any of the HTML files in a modern browser — no build step or server is required.

## Testing & quality

Automation is orchestrated with npm scripts. After installing dependencies (`npm install`), run:

```bash
npm test
```

This command executes:

- `npm run test:unit` — Vitest unit coverage for reusable utilities.
- `npm run test:integration` — JSDOM-backed integration checks to ensure the HTML experiences behave as expected.
- Placeholder commands for worker, Playwright, Detox, and contract suites that document the future-facing strategy.

Coverage thresholds are enforced via `vitest.config.js`. Detailed guidance, along with the QA checklist, lives in the `docs/` directory:

- [`docs/testing-strategy.md`](docs/testing-strategy.md)
- [`docs/qa-checklist.md`](docs/qa-checklist.md)

## Repository layout

```
├── docs/                 # Testing strategy and QA checklist
├── scripts/              # Helper scripts invoked by npm test commands
├── src/                  # Shared JavaScript utilities with unit coverage
├── tests/                # Unit and integration test suites (Vitest)
├── *.html                # Standalone HTML tools
└── .github/workflows/    # CI pipeline definition
```
