import { listMetadataRecords } from '../storage/metadataStore.js';
import { readChunks } from '../storage/chunkStorage.js';
import { normalizeWhitespace, words } from '../utils/stringUtils.js';

export async function searchDocuments(query) {
  const normalizedQuery = normalizeWhitespace(query).toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const queryTokens = Array.from(new Set(words(normalizedQuery)));
  if (queryTokens.length === 0) {
    return [];
  }

  const records = await listMetadataRecords();
  const matches = [];

  for (const record of records) {
    const chunks = await readChunks(record.id);
    const combined = [record.summary, ...(record.keyPoints || []), ...(record.tags || [])];
    for (const chunk of chunks.slice(0, 5)) {
      combined.push(chunk.text);
    }

    const tokenSet = new Set(words(combined.join(' ')));
    let score = 0;
    for (const token of queryTokens) {
      if (tokenSet.has(token)) {
        score += 1;
      }
    }

    if (score > 0) {
      matches.push({
        documentId: record.id,
        score,
        summary: record.summary,
        keyPoints: record.keyPoints,
        citations: record.citations,
        tags: record.tags,
        chunkCount: record.chunkCount,
        model: record.model
      });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  return matches;
}
