import { nanoid } from 'nanoid';
import { saveRawFile } from '../storage/supabaseStorage.js';
import { writeNotebook, readNotebook } from '../storage/notebookStorage.js';
import { writeChunks, readChunks } from '../storage/chunkStorage.js';
import { extractTextFromFile } from './textExtractor.js';
import { fetchWebDocument } from './webIngestor.js';
import { chunkText } from './chunker.js';
import { orchestrateSummarization } from './summarizer.js';
import { generateTags } from './tagging.js';
import { upsertMetadataRecord, getMetadataRecord, listMetadataRecords } from '../storage/metadataStore.js';
import { normalizeWhitespace } from '../utils/stringUtils.js';

function parseMetadata(metadata) {
  if (!metadata) {
    return {};
  }

  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch {
      return { note: metadata };
    }
  }

  return metadata;
}

export async function ingestDocument({ sourceType, file, url, metadata }) {
  const documentId = nanoid();
  const parsedMetadata = parseMetadata(metadata);
  const receivedAt = new Date().toISOString();

  let extractionText;
  let storageEntry;
  let descriptor;

  if (sourceType === 'upload') {
    if (!file) {
      throw new Error('An uploaded file is required for upload ingestion');
    }

    descriptor = {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size
    };

    storageEntry = await saveRawFile(documentId, file.originalname, file.buffer);
    extractionText = await extractTextFromFile({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype
    });
  } else if (sourceType === 'web') {
    if (!url) {
      throw new Error('A URL is required for web ingestion');
    }

    const fetched = await fetchWebDocument(url);
    descriptor = {
      originalName: url,
      mimeType: 'text/html',
      size: Buffer.byteLength(fetched.raw, 'utf8')
    };

    storageEntry = await saveRawFile(documentId, fetched.filename, Buffer.from(fetched.raw, 'utf8'));
    extractionText = fetched.text;
  } else {
    throw new Error(`Unsupported sourceType: ${sourceType}`);
  }

  const normalizedText = normalizeWhitespace(extractionText);
  const chunks = await chunkText(normalizedText);
  const summaryPayload = orchestrateSummarization(normalizedText, chunks);
  const tags = generateTags(normalizedText, parsedMetadata?.tags);

  await writeChunks(documentId, chunks);

  const notebookTitle = parsedMetadata?.notebookTitle || descriptor.originalName;
  const notebookPayload = {
    title: notebookTitle,
    summary: summaryPayload.summary,
    keyPoints: summaryPayload.keyPoints,
    citations: summaryPayload.citations,
    tags,
    model: summaryPayload.model,
    source: {
      type: sourceType,
      originalName: descriptor.originalName,
      mimeType: descriptor.mimeType,
      url: sourceType === 'web' ? url : null
    }
  };

  const notebook = await writeNotebook(documentId, notebookPayload);

  const storedRecord = await upsertMetadataRecord({
    id: documentId,
    sourceType,
    originalName: descriptor.originalName,
    mimeType: descriptor.mimeType,
    size: descriptor.size,
    storageBucket: storageEntry.bucket,
    storagePath: storageEntry.path,
    tags,
    chunkCount: chunks.length,
    model: summaryPayload.model,
    summary: summaryPayload.summary,
    keyPoints: summaryPayload.keyPoints,
    citations: summaryPayload.citations,
    notebookPath: notebook.path,
    notebookTitle,
    sourceUrl: sourceType === 'web' ? url : null,
    createdAt: receivedAt,
    metadata: parsedMetadata?.custom || {}
  });

  return {
    documentId,
    summary: summaryPayload.summary,
    keyPoints: summaryPayload.keyPoints,
    citations: summaryPayload.citations,
    tags,
    chunkCount: chunks.length,
    model: summaryPayload.model,
    storagePath: storageEntry.path,
    notebookPath: notebook.path,
    metadata: storedRecord
  };
}

export async function getDocument(documentId) {
  const metadata = await getMetadataRecord(documentId);
  if (!metadata) {
    return null;
  }

  const notebook = await readNotebook(documentId);
  const chunks = await readChunks(documentId);

  return {
    ...metadata,
    notebook,
    chunks
  };
}

export async function listDocuments() {
  return listMetadataRecords();
}

export async function getNotebook(documentId) {
  return readNotebook(documentId);
}
