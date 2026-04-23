import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.PORT = '3300';
process.env.NODE_ENV = 'test';

let server;

before(async () => {
  server = (await import('../server.js')).default;
});

after(() => {
  if (server?.close) server.close();
});

const BASE = 'http://localhost:3300';

async function post(path, body) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// GET /health
test('GET /health retorna status ok', async () => {
  const res = await fetch(`${BASE}/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.ok(data.timestamp);
});

// POST /api/phrases/ratings — avaliação válida
test('POST /api/phrases/ratings aceita avaliação válida e armazena', async () => {
  const res = await post('/api/phrases/ratings', {
    phrase: 'Acredite no seu potencial e avance.',
    phraseType: 'motivational',
    rating: 4,
  });
  assert.equal(res.status, 201);
  const data = await res.json();
  assert.ok(data.message);
});

// POST /api/phrases/ratings — nota fora do intervalo
test('POST /api/phrases/ratings rejeita nota fora do intervalo', async () => {
  const res = await post('/api/phrases/ratings', {
    phrase: 'Acredite no seu potencial e avance.',
    phraseType: 'motivational',
    rating: 6,
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.ok(data.error);
});

// POST /api/phrases/ratings — phraseType inválido
test('POST /api/phrases/ratings rejeita phraseType inválido', async () => {
  const res = await post('/api/phrases/ratings', {
    phrase: 'Qualquer frase.',
    phraseType: 'desconhecido',
    rating: 3,
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.ok(data.error);
});

// Rate limiting — /api/phrases/ratings
test('Rate limiting bloqueia após 30 requisições por minuto', async () => {
  let lastRes;
  for (let i = 0; i < 35; i++) {
    lastRes = await post('/api/phrases/ratings', {
      phrase: 'Frase de teste de rate limit.',
      phraseType: 'satirical',
      rating: 3,
    });
  }
  assert.equal(lastRes.status, 429);
  const data = await lastRes.json();
  assert.equal(data.error, 'Muitas requisições. Tente novamente mais tarde.');
});
