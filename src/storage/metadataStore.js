import { promises as fs } from 'fs';
import { metadataFile } from '../config/paths.js';

async function readAll() {
  try {
    const data = await fs.readFile(metadataFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeAll(records) {
  await fs.writeFile(metadataFile, JSON.stringify(records, null, 2), 'utf8');
}

export async function upsertMetadataRecord(record) {
  const records = await readAll();
  const filtered = records.filter((item) => item.id !== record.id);
  const updated = {
    ...record,
    updatedAt: new Date().toISOString()
  };
  filtered.push(updated);
  await writeAll(filtered);
  return updated;
}

export async function getMetadataRecord(documentId) {
  const records = await readAll();
  return records.find((record) => record.id === documentId) ?? null;
}

export async function listMetadataRecords() {
  return readAll();
}
