# Local llama.cpp server (Phi-3-mini GGUF)

The orchestrator dispatches low-latency requests to a local llama.cpp server that exposes a simple HTTP API. Follow the steps below to run the service inside a container.

## Requirements

- Docker 24+
- At least 8 GB of RAM (Phi-3-mini 4K Q4_0 uses ~4 GB)
- A downloaded Phi-3-mini GGUF model file (`phi-3-mini-4k-instruct-q4_0.gguf`)

## 1. Download the model

Create a directory to persist models and download Phi-3-mini:

```bash
mkdir -p ~/.llama.cpp/models
cd ~/.llama.cpp/models
wget https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/phi-3-mini-4k-instruct-q4_0.gguf
```

## 2. Run the llama.cpp HTTP server

```bash
docker run \
  --rm \
  --name phi3-server \
  -p 8080:8080 \
  -v ~/.llama.cpp/models:/models \
  ghcr.io/ggerganov/llama.cpp:server \
  --model /models/phi-3-mini-4k-instruct-q4_0.gguf \
  --port 8080 \
  --ctx-size 4096 \
  --n-gpu-layers 0
```

The container exposes a REST API compatible with the orchestrator’s local adapter:

- **Endpoint:** `POST http://localhost:8080/completion`
- **Body:**
  ```json
  {
    "prompt": "Say hello",
    "temperature": 0.2,
    "n_predict": 256
  }
  ```

## 3. Validate connectivity

After the container starts, verify the server is responding:

```bash
curl -X POST http://localhost:8080/completion \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Respond with pong.", "n_predict": 32}'
```

You should receive a JSON payload containing `content`, which the orchestrator will surface as the completion text.

## 4. Environment configuration

Ensure the orchestrator service can reach `http://localhost:8080`. If you are running inside Docker Compose, use the service name instead of `localhost` and update the `LOCAL_LLAMA_BASE_URL` (optional override) when instantiating the adapter.
