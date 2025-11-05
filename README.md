# Workplace Tools

This repository now includes a proactive intelligence engine that aggregates calendar events, habits, and mood journals to deliver timely nudges and routine suggestions. The engine is designed to run as a background worker and integrates with a simulated Firebase Cloud Messaging (FCM) transport.

## Features

- Context aggregation across calendar events, tracked habits, and recent mood entries.
- Rule-based forecasting pipeline that estimates readiness for focus blocks (Prophet-ready interfaces).
- Scoring heuristics to prioritise calendar preparations, habit reminders, mood check-ins, and routine prompts.
- Notification queue with quiet-hour controls, escalation rules, and deduplication windows.
- Background simulation script demonstrating proactive alerts flowing through the queue and into the FCM stub.
- Lightweight test harness that validates quiet-hour scheduling windows and deduplication rules.

## Getting Started

Ensure you have Node.js (v18+) installed.

```bash
npm install # no dependencies, but initialises package lock if desired
```

### Run the background simulation

```bash
npm start
```

The script prints aggregated suggestions, shows how notifications are deferred during quiet hours, and demonstrates FCM dispatch responses.

### Run tests

```bash
npm test
```

The tests validate that notifications respect quiet-hour constraints, deduplicate within configured windows, and that the proactive engine produces actionable suggestions.
