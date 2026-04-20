import { readFile, rm } from 'node:fs/promises';

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function rmWithRetry(targetPath, attempts = 5, delayMs = 50) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await rm(targetPath, { recursive: true, force: true });
      return;
    } catch (error) {
      lastError = error;
      await wait(delayMs * attempt);
    }
  }

  if (lastError) {
    throw lastError;
  }
}

export async function readJsonWithRetry(filePath, attempts = 5, delayMs = 50) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return JSON.parse(await readFile(filePath, 'utf-8'));
    } catch (error) {
      lastError = error;
      if (!['EPERM', 'EBUSY', 'ENOENT'].includes(error.code)) {
        throw error;
      }
      await wait(delayMs * attempt);
    }
  }

  throw lastError;
}
