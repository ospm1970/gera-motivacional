import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { addEntry, getHistory } from '../history.js';
import { readJsonWithRetry, rmWithRetry } from '../test-utils/fs-test-utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.join(projectRoot, 'data');
const historyFile = path.join(dataDir, 'history.json');

beforeEach(async () => {
  await rmWithRetry(dataDir);
});

test('history.js retorna array vazio quando o arquivo ainda não existe', async () => {
  const entries = await getHistory();
  assert.deepEqual(entries, []);
});

test('history.js retorna array vazio quando o JSON está malformado', async () => {
  await mkdir(dataDir, { recursive: true });
  await writeFile(historyFile, '{ invalido', 'utf-8');

  const entries = await getHistory();
  assert.deepEqual(entries, []);
});

test('history.js persiste entradas e respeita o limite solicitado', async () => {
  await addEntry({ words: ['um', 'dois', 'tres'], motivationalPhrase: 'A', satiricalPhrase: 'B', timestamp: '2026-01-01T00:00:00.000Z' });
  await addEntry({ words: ['quatro', 'cinco', 'seis'], motivationalPhrase: 'C', satiricalPhrase: 'D', timestamp: '2026-01-02T00:00:00.000Z' });

  const entries = await getHistory(1);
  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0].words, ['quatro', 'cinco', 'seis']);

  const persisted = await readJsonWithRetry(historyFile);
  assert.equal(persisted.length, 2);
});

test('history.js mantém no máximo 100 entradas', async () => {
  for (let index = 0; index <= 100; index += 1) {
    await addEntry({
      words: ['palavra', 'foo', 'bar'],
      motivationalPhrase: `motivacional-${index}`,
      satiricalPhrase: `satirica-${index}`,
      timestamp: `2026-01-01T00:00:${String(index).padStart(2, '0')}.000Z`,
    });
  }

  const entries = await getHistory(150);
  assert.equal(entries.length, 100);
  assert.equal(entries[0].motivationalPhrase, 'motivacional-100');
  assert.equal(entries.at(-1).motivationalPhrase, 'motivacional-1');
});

test('history.js sobrescreve corretamente o arquivo de histórico', async () => {
  await mkdir(dataDir, { recursive: true });
  await writeFile(historyFile, JSON.stringify([{ words: ['antigo', 'registro', 'aqui'] }]), 'utf-8');

  await addEntry({
    words: ['novo', 'registro', 'ok'],
    motivationalPhrase: 'Frase nova',
    satiricalPhrase: 'Outra nova',
    timestamp: '2026-01-03T00:00:00.000Z',
  });

  const persisted = await readJsonWithRetry(historyFile);
  assert.deepEqual(persisted[0].words, ['novo', 'registro', 'ok']);
});
