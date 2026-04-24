import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.PORT = '3306';
process.env.NODE_ENV = 'test';

let server;

before(async () => {
  server = (await import('../server.js')).default;
});

after(() => {
  if (server?.close) server.close();
});

const BASE = 'http://localhost:3306';

test('GET /api/phrases/ratings/average retorna null quando não há avaliações', async () => {
  const res = await fetch(`${BASE}/api/phrases/ratings/average`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok('average' in body);
});

test('GET /api/phrases/ratings/average reflete avaliação inserida via POST', async () => {
  await fetch(`${BASE}/api/phrases/ratings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phrase: 'Frase de teste para média de avaliações.',
      phraseType: 'motivational',
      rating: 4,
    }),
  });

  const res = await fetch(`${BASE}/api/phrases/ratings/average`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.average !== null);
  assert.equal(typeof body.average, 'number');
  assert.ok(body.average >= 1 && body.average <= 5);
});
