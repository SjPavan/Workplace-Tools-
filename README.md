# Workplace Tools

A curated set of web-based productivity utilities. The newest addition is the **Productivity Mission Control** dashboard (`web-productivity-dashboard.html`), a responsive control center that pulls together day planning, task management, routines, habit insights, mood logging, a calendar snapshot, and a proactive suggestion feed.

## Productivity Mission Control

- **Daily planner** with drag-and-drop time blocking for the workday.
- **Task queue** synced from `/data/productivity-data.json` with priority and duration context.
- **Habit tracking** including a weekly completion chart rendered with Recharts.
- **Mood logging** stored locally for offline resilience.
- **Calendar overview** highlighting upcoming events.
- **Proactive suggestions** to nudge next steps and provide documentation callouts.
- **Offline fallback** via local caching and a service worker when the backend is unreachable.

### Running the Playwright integration tests

1. Install dependencies:
   ```bash
   npm install
   ```
2. Execute the E2E suite (captures screenshots to `tests/screenshots/`):
   ```bash
   npm run test:e2e
   ```

The tests validate the main user flows—data loading, drag-and-drop scheduling, mood logging, screenshot generation, and offline fallback behaviour.
