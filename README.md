# Workplace Tools API Suite

This repository now bundles lightweight single-page utilities alongside a JSON-first coding assistant API.

## Coding Assistant APIs

The assistant exposes structured endpoints to generate, explain, and debug source code while keeping track of
conversation context.

### Base URL

```
/api/assistant
```

### Authentication

No authentication is required for local development. Apply your own middleware if you deploy externally.

### Rate Limiting

Requests are throttled to 30 calls per minute per IP across all assistant endpoints. Exceeding the limit returns
`429` with `{ "error": "Rate limit exceeded. Try again shortly." }`.

### Endpoints

#### `POST /api/assistant/generate`

Generate code using syntax-aware prompts tailored for CodeLlama.

Request body:

```json
{
  "prompt": "create a function that sums two numbers",
  "starterCode": "function sum(a, b) { return a + b }",
  "language": "javascript",
  "conversationId": "optional-existing-id",
  "filename": "optional_hint.js"
}
```

Response snapshot:

```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "model": "CodeLlama-34B-Generate-General",
  "language": "javascript",
  "prompt": "Model: CodeLlama for javascript...",
  "message": "// Generated helper...",
  "metadata": {
    "languageDetection": {
      "language": "javascript",
      "source": "heuristic"
    },
    "historySize": 2
  },
  "kind": "generate"
}
```

#### `POST /api/assistant/explain`

Explain code using StarCoder-flavoured prompts.

```json
{
  "conversationId": "uuid",
  "code": "def greet(name):\n    return \"Hello \" + name\n",
  "question": "What does this function return?"
}
```

The response includes a conversational explanation and language detection metadata.

#### `POST /api/assistant/debug`

Produce lint-style feedback, a unified diff suggestion, and CodeLlama debugging prompt.

```json
{
  "conversationId": "uuid",
  "code": "var total = value\nconsole.log(total)\n",
  "issue": "Console log is missing a semicolon"
}
```

Response metadata carries:

- `lintFeedback`: Array of lint observations with severities.
- `diff`: Unified diff (prefixed with `--- original` / `+++ updated`).
- `fixedCode`: Auto-sanitised code sample.
- `historySize`: Conversation turns captured so far.

### Session Memory

Each endpoint accepts an optional `conversationId`. If none is supplied a new conversation is created. Every reply
returns the active `conversationId`, allowing clients to chain requests while preserving context in memory.

### Language Detection

The service attempts to parse the snippet with Tree-sitter. When parsers are unavailable it gracefully falls back to
language-specific heuristics so multi-language payloads continue to work.

## Development

Install dependencies and run the automated tests:

```
npm install
npm test
```

The Jest suite (`tests/assistantApi.test.js`) verifies the response structure, conversation memory retention, and
language detection heuristics.
