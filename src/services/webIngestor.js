import { stripHtml } from './textExtractor.js';
import { slugify } from '../utils/stringUtils.js';

export async function fetchWebDocument(url) {
  if (!url) {
    throw new Error('A URL is required for web ingestion');
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to fetch content from ${url}: ${response.statusText}`);
  }

  const raw = await response.text();
  const text = stripHtml(raw);
  return {
    raw,
    text,
    filename: `${slugify(url)}.html`
  };
}
