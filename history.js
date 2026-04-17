import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const MAX_ENTRIES = 100;

async function load() {
  try {
    const raw = await readFile(HISTORY_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function save(entries) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(HISTORY_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

export async function addEntry(entry) {
  const entries = await load();
  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES) entries.splice(MAX_ENTRIES);
  await save(entries);
}

export async function getHistory(limit = 20) {
  const entries = await load();
  return entries.slice(0, limit);
}
