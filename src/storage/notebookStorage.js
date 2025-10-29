import path from 'path';
import { promises as fs } from 'fs';
import { notebooksDir } from '../config/paths.js';

export async function writeNotebook(documentId, payload) {
  const filePath = path.join(notebooksDir, `${documentId}.json`);
  const notebook = {
    ...payload,
    documentId,
    updatedAt: new Date().toISOString()
  };
  await fs.writeFile(filePath, JSON.stringify(notebook, null, 2), 'utf8');
  return { path: filePath, notebook };
}

export async function readNotebook(documentId) {
  const filePath = path.join(notebooksDir, `${documentId}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}
