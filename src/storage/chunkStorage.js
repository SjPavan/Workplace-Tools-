import path from 'path';
import { promises as fs } from 'fs';
import { chunksDir } from '../config/paths.js';

export async function writeChunks(documentId, chunks) {
  const filePath = path.join(chunksDir, `${documentId}.json`);
  await fs.writeFile(filePath, JSON.stringify(chunks, null, 2), 'utf8');
  return filePath;
}

export async function readChunks(documentId) {
  const filePath = path.join(chunksDir, `${documentId}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}
