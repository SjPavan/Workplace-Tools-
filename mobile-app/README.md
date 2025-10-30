# Mobile App – On-device AI Demo

This directory contains a React Native showcase of the Phi-3-mini on-device assistant backed by llama.cpp. It demonstrates lazy loading, battery-aware gating, a user-facing toggle to disable the local path, and a cloud fallback when the native bridge is offline or disabled.

## Quick Start

1. **Install native bridge & utilities** – Integrate `react-native-llama.cpp` (or equivalent) that exposes the `LlamaBridge` module expected by the TypeScript API and add `@react-native-community/netinfo` for connectivity checks. Verify `loadModel`, `generate`, `streamGenerate`, `cancel`, and `getBatteryLevel` are available.
2. **Package the GGUF model** – Follow the steps in [`docs/on-device-ai.md`](../docs/on-device-ai.md) to add `phi-3-mini-4k-instruct-q4.gguf` to both Android and iOS bundles.
3. **Run the demo**:
   ```bash
   yarn install
   cd ios && pod install && cd ..
   yarn ios   # or yarn android
   ```
4. **Toggle behaviour** – The UI switch labelled “Enable Local Model” invokes `localModelManager.setEnabled` and updates the assistant to use or skip on-device inference.
5. **Benchmark** – Execute `./scripts/offline-benchmark.js` (after setting `LLAMA_CPP_CLI` and `PHI3_MODEL_PATH`) to validate the <5s offline latency requirement.

## Key Files

- `App.tsx` – Minimal UX for testing responses, showing the inference source and latency.
- `src/ai/LocalModelManager.ts` – Handles model lifecycle, lazy loading, streaming, and battery checks.
- `src/ai/AssistantClient.ts` – Chooses between local inference and cloud fallback based on connectivity and user preferences.
- `scripts/offline-benchmark.js` – CLI harness for performance validation against the acceptance criteria.
