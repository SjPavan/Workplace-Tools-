const fs = require('fs');
const path = require('path');

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function ensureFile(filePath, seed = '') {
  ensureDirectory(path.dirname(filePath));
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, seed);
  }
}

async function readJsonFile(filePath, fallback) {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    if (!content.trim()) {
      return fallback;
    }
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return fallback;
    }
    throw error;
  }
}

async function writeJsonFile(filePath, data) {
  ensureDirectory(path.dirname(filePath));
  const serialized = JSON.stringify(data, null, 2);
  await fs.promises.writeFile(filePath, `${serialized}\n`, 'utf8');
}

module.exports = {
  ensureDirectory,
  ensureFile,
  readJsonFile,
  writeJsonFile,
};
