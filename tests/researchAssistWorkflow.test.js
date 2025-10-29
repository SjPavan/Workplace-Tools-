import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { promises as fs } from 'fs';
import JSZip from 'jszip';
import app from '../src/app.js';
import { dataDir, ensureDataDirectories } from '../src/config/paths.js';

async function resetDataDirectory() {
  await fs.rm(dataDir, { recursive: true, force: true });
  await ensureDataDirectories();
}

async function createDocxBuffer(text) {
  const zip = new JSZip();
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`;
  zip.file('word/document.xml', xml);
  zip.file('[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>'
  );
  return zip.generateAsync({ type: 'nodebuffer' });
}

describe('Research assist workflow integration', () => {
  beforeEach(async () => {
    await resetDataDirectory();
  });

  it('ingests a document, generates notebook data, and returns it in search results', async () => {
    const sampleBuffer = Buffer.from(
      'Research Summary\nArtificial intelligence improves summarization quality by combining retrieval augmented generation with concise synthesis.',
      'utf8'
    );

    const ingestResponse = await request(app)
      .post('/api/documents/ingest')
      .field('sourceType', 'upload')
      .field('metadata', JSON.stringify({ notebookTitle: 'AI Research Notes', tags: ['ai', 'research'] }))
      .attach('file', sampleBuffer, { filename: 'sample.pdf', contentType: 'application/pdf' });

    expect(ingestResponse.status).toBe(201);
    expect(ingestResponse.body.documentId).toBeDefined();
    expect(ingestResponse.body.summary.length).toBeGreaterThan(0);
    expect(Array.isArray(ingestResponse.body.keyPoints)).toBe(true);
    expect(Array.isArray(ingestResponse.body.citations)).toBe(true);
    expect(ingestResponse.body.tags).toContain('ai');

    const { documentId, summary } = ingestResponse.body;

    const notebookResponse = await request(app).get(`/api/documents/${documentId}/notebook`);
    expect(notebookResponse.status).toBe(200);
    expect(notebookResponse.body.summary).toBe(summary);

    const searchResponse = await request(app)
      .get('/api/search')
      .query({ q: 'retrieval augmented generation' });
    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body.results.some((entry) => entry.documentId === documentId)).toBe(true);

    const documentResponse = await request(app).get(`/api/documents/${documentId}`);
    expect(documentResponse.status).toBe(200);
    expect(documentResponse.body.notebook.summary).toBe(summary);
  });

  it('ingests DOCX content and produces a searchable notebook entry', async () => {
    const docxBuffer = await createDocxBuffer('Knowledge workers capture reusable insights into structured notebooks.');

    const ingestResponse = await request(app)
      .post('/api/documents/ingest')
      .field('sourceType', 'upload')
      .attach('file', docxBuffer, {
        filename: 'notebook.docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

    expect(ingestResponse.status).toBe(201);
    expect(ingestResponse.body.documentId).toBeDefined();
    expect(ingestResponse.body.summary.length).toBeGreaterThan(0);

    const searchResponse = await request(app)
      .get('/api/search')
      .query({ q: 'knowledge workers' });

    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body.results.some((entry) => entry.documentId === ingestResponse.body.documentId)).toBe(true);
  });

  it('ingests web content as JSON and makes it searchable', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      statusText: 'OK',
      text: async () => '<html><body><h1>Web Source</h1><p>Researchers rely on timely summarisation workflows.</p></body></html>'
    });

    try {
      const ingestResponse = await request(app)
        .post('/api/documents/ingest')
        .send({
          sourceType: 'web',
          url: 'https://example.com/research',
          metadata: {
            tags: ['web']
          }
        });

      expect(ingestResponse.status).toBe(201);
      expect(ingestResponse.body.documentId).toBeDefined();

      const searchResponse = await request(app)
        .get('/api/search')
        .query({ q: 'timely summarisation' });

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body.results.some((entry) => entry.documentId === ingestResponse.body.documentId)).toBe(true);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
