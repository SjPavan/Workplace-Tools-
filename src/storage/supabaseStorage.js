import path from 'path';
import { promises as fs } from 'fs';
import { rawDir } from '../config/paths.js';
import { slugify } from '../utils/stringUtils.js';

export async function saveRawFile(documentId, originalName, buffer) {
  const safeName = slugify(originalName);
  const documentDir = path.join(rawDir, documentId);
  await fs.mkdir(documentDir, { recursive: true });

  const stampedName = `${Date.now()}-${safeName}`;
  const storagePath = path.join(documentDir, stampedName);
  await fs.writeFile(storagePath, buffer);

  return {
    bucket: 'research-assist-raw',
    path: storagePath
  };
}
