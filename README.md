# Workplace Tools

A collection of lightweight utilities now featuring an AI orchestration layer that routes requests across multiple large language model providers. The service exposes a single `/ai/complete` endpoint with intelligent provider selection, caching, and streaming responses.

## Features

- **Provider routing** between HuggingFace Inference (CodeLlama / StarCoder), Groq Llama 3, Gemini, and a local llama.cpp (Phi-3-mini GGUF) runtime.
- **Unified adapter interface** that normalises requests and responses across providers.
- **Safety filtering** for prompt sanitisation and maximum length checks.
- **In-memory caching** layer with TTL support to minimise duplicated completions.
- **Automatic rate-limit fallbacks** to reroute traffic when a provider returns HTTP 429.
- **Server-Sent Events (SSE) streaming** for low-latency token delivery.

## Getting started

The backend is a Node.js service that requires Node 18 or newer.

```bash
npm install
npm start
```

The server listens on port `3000` by default. Adjust the `PORT` environment variable to change the bind port.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `HF_API_TOKEN` | HuggingFace Inference API token for CodeLlama / StarCoder access |
| `GROQ_API_KEY` | Groq Cloud API key for Llama 3 completions |
| `GOOGLE_API_KEY` | Google Generative AI key for Gemini free-tier usage |
| `LOCAL_LLAMA_BASE_URL` | Optional override for the llama.cpp HTTP endpoint (defaults to `http://localhost:8080`) |

### Local llama.cpp runtime

To serve low-latency requests, the orchestrator expects a llama.cpp server running Phi-3-mini in HTTP mode at `http://localhost:8080`. Detailed setup instructions are available in [docs/local-llamacpp.md](docs/local-llamacpp.md).

## API usage

### `POST /ai/complete`

Request body:

```json
{
  "prompt": "Write a docstring for this function",
  "domain": "code",
  "complexity": "medium",
  "priority": "accuracy",
  "multimodalInputs": []
}
```

Query parameters:

- `stream=true` – receive a Server-Sent Events stream for incremental completions.

#### Response (non-streaming)

```json
{
  "text": "Generated completion...",
  "raw": { "provider": "groq" },
  "provider": "groq",
  "fromCache": false
}
```

#### Response (streaming)

The endpoint returns a `text/event-stream` with payloads shaped as:

```
data: {"event":"chunk","provider":"local","text":"Hello"}

data: {"event":"chunk","provider":"local","text":" world"}

event: done
data: {}
```

## Testing

Mocked integrations ensure no external calls are made when running the suite.

```bash
npm test
```

The orchestrator and HTTP layer tests cover provider routing, caching, streaming, and rate-limit handling.
