import path from 'path';
import JSZip from 'jszip';
import { normalizeWhitespace } from '../utils/stringUtils.js';

export async function extractTextFromFile({ buffer, originalName, mimeType }) {
  const extension = path.extname(originalName || '').toLowerCase();

  if (extension === '.docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return normalizeWhitespace(await extractDocx(buffer));
  }

  if (extension === '.pdf' || mimeType === 'application/pdf') {
    return normalizeWhitespace(extractPdf(buffer));
  }

  if (extension === '.html' || extension === '.htm' || mimeType === 'text/html') {
    return normalizeWhitespace(stripHtml(buffer.toString('utf8')));
  }

  return normalizeWhitespace(buffer.toString('utf8'));
}

export function extractPdf(buffer) {
  const content = buffer.toString('utf8');
  return content.replace(/[^\x09\x0A\x0D\x20-\x7E]+/g, ' ');
}

export async function extractDocx(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = await zip.file('word/document.xml').async('string');
  return documentXml
    .replace(/<w:p[^>]*>/g, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function stripHtml(html) {
  return html.replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}
