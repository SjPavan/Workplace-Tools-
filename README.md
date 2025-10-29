# Workplace Tools

This repository hosts a group of productivity utilities. It now includes a lightweight research-assistant backend that can ingest documents, create summaries, extract key points with citations, and serve searchable notebooks generated from the processed content.

## Research Assist Services

### Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the service:

   ```bash
   npm start
   ```

   The API will be available on `http://localhost:3000`.

3. Run the integration tests:

   ```bash
   npm test
   ```

### API surface

- `POST /api/documents/ingest`
  - Accepts `multipart/form-data` for file uploads (`file` field) or JSON payloads for web links.
  - Required field: `sourceType` (`upload` or `web`).
  - Optional field: `metadata` (stringified JSON containing `notebookTitle`, `tags`, or a `custom` object).
  - Example JSON payload for web ingestion:

    ```json
    {
      "sourceType": "web",
      "url": "https://example.com/research",
      "metadata": {
        "notebookTitle": "Example research",
        "tags": ["example", "research"]
      }
    }
    ```
  - On success returns the generated `documentId`, summary data, citations, tags, and notebook location.

- `GET /api/documents`
  - Lists stored document metadata and notebook locations.

- `GET /api/documents/:id`
  - Retrieves the enriched document record including chunks and notebook reference.

- `GET /api/documents/:id/notebook`
  - Returns the notebook entry (summary, key points, citations, and tags) for the document.

- `GET /api/search?q=<terms>`
  - Searches across summaries, key points, and representative chunks. Results are ranked by keyword overlap.

### Supported formats

- **File uploads:** PDF (text-based), DOCX, HTML, and plain text. Files are stored in Supabase-compatible bucket paths on the local filesystem.
- **Web links:** HTML pages fetched via `fetch()` and converted to notebook entries.

Uploaded content is chunked using a LangChain-compatible recursive text splitter. Summarisation is orchestrated dynamically based on document size to produce an appropriate level of detail. Key points are extracted from the generated summary and mapped back to content chunks to provide citation anchors. All derived artefacts are saved to notebook JSON files for later retrieval.

### Data storage

Runtime artefacts are stored under the `data/` directory:

- `data/raw/` — Supabase-style raw file storage
- `data/chunks/` — chunked content per document
- `data/notebooks/` — notebook JSON files
- `data/metadata.json` — searchable metadata index

### Testing the workflow

The Vitest integration specification in `tests/researchAssistWorkflow.test.js` covers the end-to-end ingestion workflow:

1. Uploading a sample PDF payload
2. Generating summaries, key points, citations, and notebook data
3. Locating the document through the search endpoint
4. Retrieving the notebook entry via the API

Running `npm test` will execute the full workflow.
