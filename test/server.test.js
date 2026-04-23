import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.PORT = '3099';
process.env.NODE_ENV = 'test';

let server;

before(async () => {
  const mod = await import('../server.js');
  server = mod.default;
});

after(() => {
  if (server?.close) server.close();
});

const BASE = 'http://localhost:3099';

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
test('GET /health retorna status ok', async () => {
  const res = await fetch(`${BASE}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
  assert.ok(body.timestamp);
});

// ---------------------------------------------------------------------------
// POST /api/phrases — validação de entrada
// ---------------------------------------------------------------------------
test('POST /api/phrases sem body retorna 400', async () => {
  const res = await fetch(`${BASE}/api/phrases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.error);
});

test('POST /api/phrases com menos de 3 palavras retorna 400', async () => {
  const res = await fetch(`${BASE}/api/phrases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words: ['amor', 'fé'] }),
  });
  assert.equal(res.status, 400);
});

test('POST /api/phrases com mais de 3 palavras retorna 400', async () => {
  const res = await fetch(`${BASE}/api/phrases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words: ['a', 'b', 'c', 'd'] }),
  });
  assert.equal(res.status, 400);
});

test('POST /api/phrases com palavras vazias retorna 400', async () => {
  const res = await fetch(`${BASE}/api/phrases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words: ['', 'fé', 'esperança'] }),
  });
  assert.equal(res.status, 400);
});

test('POST /api/phrases com caracteres inválidos retorna 400', async () => {
  const res = await fetch(`${BASE}/api/phrases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words: ['amor123', 'fé', 'esperança'] }),
  });
  assert.equal(res.status, 400);
});

// ---------------------------------------------------------------------------
// POST /api/phrases/ratings — validação
// ---------------------------------------------------------------------------
test('POST /api/phrases/ratings sem body retorna 400', async () => {
  const res = await fetch(`${BASE}/api/phrases/ratings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 400);
});

test('POST /api/phrases/ratings com nota inválida retorna 400', async () => {
  const res = await fetch(`${BASE}/api/phrases/ratings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phrase: 'Frase teste', phraseType: 'motivational', rating: 6 }),
  });
  assert.equal(res.status, 400);
});

test('POST /api/phrases/ratings com phraseType inválido retorna 400', async () => {
  const res = await fetch(`${BASE}/api/phrases/ratings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phrase: 'Frase teste', phraseType: 'invalid', rating: 3 }),
  });
  assert.equal(res.status, 400);
});

test('POST /api/phrases/ratings válido retorna 201', async () => {
  const res = await fetch(`${BASE}/api/phrases/ratings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phrase: 'Frase de teste para avaliação', phraseType: 'motivational', rating: 4 }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.ok(body.message);
});

// ---------------------------------------------------------------------------
// GET /api/history
// ---------------------------------------------------------------------------
test('GET /api/history retorna lista de entradas', async () => {
  const res = await fetch(`${BASE}/api/history`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.entries));
  assert.ok(typeof body.count === 'number');
});

test('GET /api/history respeita parâmetro limit', async () => {
  const res = await fetch(`${BASE}/api/history?limit=5`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.entries.length <= 5);
});

// ---------------------------------------------------------------------------
// Módulo history.js
// ---------------------------------------------------------------------------
test('history.js — addEntry e getHistory persistem dados', async () => {
  const { addEntry, getHistory } = await import('../history.js');

  const entry = {
    words: ['teste', 'unidade', 'node'],
    motivationalPhrase: 'Frase motivacional de teste.',
    satiricalPhrase: 'Frase satírica de teste.',
    timestamp: new Date().toISOString(),
  };

  await addEntry(entry);
  const history = await getHistory(1);
  assert.equal(history.length, 1);
  assert.deepEqual(history[0].words, entry.words);
});
