# Workplace Tools

Standalone browser utilities used around the workplace. Everything is self-contained vanilla HTML, CSS, and JavaScript so you can open individual files directly in a browser and start experimenting.

## Offline Sync Engine Playground

The `offline-sync-engine.html` page simulates a cross-platform data layer that keeps Supabase data in sync with on-device storage:

- Queues offline mutations per device and replays them when connectivity resumes.
- Runs background sync loops with conflict detection and last-write-wins resolution rules.
- Shows user-facing notifications for successful syncs and conflicts.
- Registers a service worker (`offline-sync-sw.js`) to provide offline caching and background sync triggers.
- Bundles browser-based integration tests that simulate offline edits on both "mobile" and "web" clients to demonstrate eventual consistency.

### Usage

1. Open `offline-sync-engine.html` in a modern desktop browser.
2. Use the mobile/web panels to queue updates, toggle offline mode, and observe queued mutation handling.
3. Click **Run Integration Tests** to execute the bundled offline/online reconciliation scenarios and review the results.

No build tooling is required—open the HTML file directly and everything will run in-browser.
