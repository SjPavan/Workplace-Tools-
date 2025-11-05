import { fileURLToPath } from 'url';
import path from 'path';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const projectRoot = path.resolve(__dirname, '../../');
export const dataDir = path.join(projectRoot, 'data');
export const rawDir = path.join(dataDir, 'raw');
export const chunksDir = path.join(dataDir, 'chunks');
export const notebooksDir = path.join(dataDir, 'notebooks');
export const metadataFile = path.join(dataDir, 'metadata.json');

export async function ensureDataDirectories() {
  await Promise.all([
    fs.mkdir(rawDir, { recursive: true }),
    fs.mkdir(chunksDir, { recursive: true }),
    fs.mkdir(notebooksDir, { recursive: true })
  ]);

  try {
    await fs.access(metadataFile);
  } catch {
    await fs.writeFile(metadataFile, JSON.stringify([], null, 2), 'utf8');
  }
}
