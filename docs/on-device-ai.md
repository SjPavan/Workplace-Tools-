# On-device AI Integration

This repository now includes a reference React Native implementation that integrates a lightweight Phi-3-mini model using a llama.cpp bridge. The solution is optimised for mobile, loads models lazily, respects battery constraints, and falls back to a cloud endpoint when the local path is disabled or unavailable.

---

## Architecture Overview

```
mobile-app/
├── App.tsx                     # Demo UI with local-model toggle and fallback status
├── src/
│   └── ai/
│       ├── AssistantClient.ts  # Orchestrates local vs cloud inference decisions
│       └── LocalModelManager.ts# Manages llama.cpp lifecycle, lazy load, streaming
└── scripts/
    └── offline-benchmark.js    # CLI benchmark validating <5s offline latency
```

Key behaviours:

- **Lazy model loading** – `LocalModelManager.ensureLoaded` defers llama.cpp initialisation until the first request and unloads when the app backgrounds to conserve memory.
- **Battery awareness** – configurable minimum battery levels block on-device inference below 20% charge by default.
- **Local toggle** – `App.tsx` exposes a UI switch (`testID="local-model-toggle"`) that maps directly to `LocalModelManager.setEnabled`.
- **Offline detection** – `AssistantClient.getAssistantResponse` uses `@react-native-community/netinfo` to detect connectivity and decides between local computation or cloud fallback.
- **Cloud fallback** – Failures of the local path (or explicit disablement) trigger a POST to a configurable remote endpoint.

---

## Packaging Phi-3-mini (GGUF)

1. **Download the model**
   ```bash
   mkdir -p mobile-app/models
   curl -L -o mobile-app/models/phi-3-mini-4k-instruct-q4.gguf \
     https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf
   ```

2. **Bundle with the native apps**
   - **iOS**: Add the GGUF file to an Xcode file group inside `ios/<AppName>/Models` and ensure it is included in the app target with the *Copy Bundle Resources* build phase. Update the path if you relocate the asset.
   - **Android**: Place the file under `android/app/src/main/assets/models/` and enable asset packaging via `android/app/build.gradle` with `aaptOptions { noCompress 'gguf' }` to avoid compression.

3. **Runtime configuration**
   - `LocalModelManager` defaults to `models/phi-3-mini-4k-instruct-q4.gguf`. Override via `localModelManager.ensureLoaded({ modelPath: 'custom/path.gguf' })`.
   - Set `LLAMA_CPP_CLI` and `PHI3_MODEL_PATH` when running the benchmark script (see below).

---

## Native Bridge Expectations

The TypeScript layer expects a native module named `LlamaBridge` exposing:

- `loadModel(config)`
- `generate(config)`
- `streamGenerate(config)` *(optional but recommended for partial token streaming)*
- `unloadModel()`
- `cancel()` *(cancels active inference, used with abort signals)*
- `getBatteryLevel()` *(fractional level 0–1)*

`react-native-llama.cpp` or a similar wrapper can provide these methods. Ensure event emission for tokens uses the `llamaToken` channel so `NativeEventEmitter` can relay updates.

---

## Cloud Fallback

Update `DEFAULT_ENDPOINT` inside `AssistantClient.ts` or pass a per-call `endpoint` value. The expected response payload is:

```json
{
  "text": "response text",
  "tokensGenerated": 128,
  "usage": {
    "total_tokens": 256,
    "completion_tokens": 128
  }
}
```

Non-2xx responses propagate as exceptions with the response body (first 500 characters) included for debugging.

---

## Benchmarking Offline Latency

The acceptance criterion requires that offline responses complete under five seconds. Use the provided script after compiling `llama.cpp`:

```bash
cd mobile-app
export LLAMA_CPP_CLI=/path/to/llama.cpp/main
export PHI3_MODEL_PATH=$(pwd)/models/phi-3-mini-4k-instruct-q4.gguf
./scripts/offline-benchmark.js "Draft a short privacy policy."  # defaults to 128 max tokens
```

The script exits with a non-zero status if latency exceeds the 5s threshold or if prerequisites are missing. It can be integrated into CI to guard regressions in performance.

---

## Developer Notes

- Install the supporting JavaScript dependencies in the mobile app (`@react-native-community/netinfo`, `react-native` 0.74+, and the llama.cpp bridge) before running Metro.
- The UI in `App.tsx` streams partial tokens when available and displays latency plus the chosen inference source for validation.
- Battery thresholds, GPU offload counts, and context sizes are tunable through the optional `loadConfig` argument on `getAssistantResponse`.
- When the app backgrounds, the local model is automatically unloaded to release RAM; re-entry triggers another lazy load.
