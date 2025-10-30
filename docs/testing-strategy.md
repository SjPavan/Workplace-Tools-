# Testing and Quality Strategy

This repository currently contains standalone HTML utilities with inline JavaScript. Even though there is no traditional backend or mobile client, we maintain a consistent testing and quality bar so the project can evolve safely. The strategy below describes what is implemented today and how the pipeline would extend as new surface areas are added.

## Summary of implemented automation

| Area | Status | How to run |
| --- | --- | --- |
| Unit tests | ✅ Implemented with Vitest (`npm run test:unit`) covering reusable utilities such as `toTitleCase` and `debounce`. | `npm run test:unit` |
| Integration tests | ✅ Implemented with Vitest + JSDOM (`npm run test:integration`) to exercise the rendered HTML in a simulated browser. | `npm run test:integration` |
| Worker job tests | ⏭️ Skipped (no worker infrastructure in this repository). Placeholder script keeps the pipeline green and documents the gap. | `npm run test:worker` |
| Frontend E2E (Playwright) | ⏭️ Skipped (no SPA or routing). Placeholder describes the future plan. | `npm run test:frontend` |
| Mobile (Detox) | ⏭️ Skipped (no mobile application). Placeholder documents expectations. | `npm run test:mobile` |
| Contract tests | ⏭️ Skipped (no service boundaries). Placeholder documents expectations. | `npm run test:contract` |

All commands are orchestrated by `npm test`, which sequentially runs each suite so GitHub Actions has a single entry point.

## Coverage

Unit tests collect V8 coverage by default. Coverage artifacts are written to the `coverage/` directory and published as both text and LCOV reports. Thresholds are enforced globally in `vitest.config.js`:

- Statements: **≥ 80%**
- Branches: **≥ 70%**
- Functions: **≥ 80%**
- Lines: **≥ 80%**

When new source files are introduced under `src/`, Vitest will include them in the coverage calculation (`all: true`), so new utilities must be accompanied by tests to keep the pipeline green.

## Detailed strategy by surface area

### Backend unit and integration tests

There is no backend in this repository. If a Node.js or API layer is introduced, the recommended approach is:

1. Co-locate backend code under `server/` with clear boundaries (controllers, services, repositories).
2. Use Vitest (or Jest) for fast, isolated unit tests with DI-friendly patterns.
3. Add integration tests that boot lightweight Express/Fastify instances and hit HTTP endpoints with Supertest.
4. Expand the GitHub Action workflow to spin up required dependencies (e.g., Postgres via services) and run `npm run test:backend`.

### Worker job tests

In a future queue/worker system (BullMQ, Cloud Tasks, etc.), adopt the following:

- Keep job processors in `workers/` and export pure functions for business logic.
- Unit-test the processors synchronously (mock queue adapters).
- Introduce integration smoke tests that instantiate the queue client against a real or in-memory backend.
- Replace the placeholder `scripts/run-worker-tests.js` with a proper command (e.g., `vitest run tests/worker`).

### Frontend testing (Jest/Vitest + Playwright)

Current unit and integration tests already exercise DOM behavior using Vitest and JSDOM. When richer client-side logic arrives, extend coverage by:

- Extracting reusable logic into modules under `src/` to keep unit tests focused and fast.
- Adding component-level tests (with React Testing Library or similar) if a framework is adopted.
- Migrating the placeholder Playwright command to a real suite (`playwright.config.ts`) that opens the generated HTML via a static server.
- Recording smoke scenarios: clipboard interactions, keyboard shortcuts, AI panel toggles, etc.

### Mobile (Detox)

If a mobile companion app is added:

- Scaffold Detox with the React Native (or Expo) project, defining build configurations for iOS and Android.
- Implement deterministic end-to-end flows that mirror the highest-risk user journeys.
- Run Detox on GitHub Actions using simulators/emulators in matrix jobs, gated behind an opt-in flag to control runtime.
- Replace `scripts/run-detox-tests.js` with the actual `detox test` command once the mobile app exists.

### Contract tests between services

Contract testing becomes critical when this toolkit consumes or exposes APIs. A recommended plan:

- Define provider contracts (e.g., Pact, Schemathesis) alongside the service exposing the API.
- Create consumer tests that verify expectations using the published provider contracts.
- Automate contract verification in CI before deploying breaking changes.
- Swap the placeholder script with real verification (e.g., `pact-broker publish/verify`).

## QA checklist

A markdown QA checklist (`docs/qa-checklist.md`) is committed to guide manual verification for releases. It complements automation by ensuring accessibility checks, cross-browser validation, and clipboard behavior are confirmed before updates are published.

## Running the suites locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Execute the full pipeline:
   ```bash
   npm test
   ```
   Coverage reports are generated automatically.
3. To run only a specific suite, use one of the scoped scripts (`npm run test:unit`, `npm run test:integration`, etc.).

## CI pipeline

GitHub Actions (`.github/workflows/ci.yml`) run on every push and pull request. The workflow:

1. Checks out the repository.
2. Installs Node.js dependencies (using npm).
3. Executes `npm test` to run all suites and enforce coverage thresholds.
4. Uploads coverage reports as workflow artifacts for visibility.

This structure satisfies the acceptance criteria by formalizing a testing strategy, wiring the pipeline, and documenting manual QA expectations while acknowledging current project boundaries.
