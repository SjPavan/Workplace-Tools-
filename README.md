# Workplace Tools

This repository aggregates a set of productivity utilities along with an on-device AI reference integration for mobile.

## On-device AI (Phi-3-mini)

- **Code**: [`mobile-app/`](mobile-app) demonstrates a React Native assistant that runs Phi-3-mini locally through a llama.cpp bridge with a user-facing toggle and cloud fallback.
- **Benchmark**: [`mobile-app/scripts/offline-benchmark.js`](mobile-app/scripts/offline-benchmark.js) verifies offline latency stays below the five-second acceptance threshold.
- **Documentation**: See [`docs/on-device-ai.md`](docs/on-device-ai.md) for packaging instructions, architecture details, and performance guidance.

Other standalone HTML tools remain in the repository root and operate independently.
