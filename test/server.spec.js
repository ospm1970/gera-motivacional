import test from 'node:test';
import assert from 'node:assert';
import { exec } from 'node:child_process';
import fetch from 'node-fetch';

let serverProcess;
const baseUrl = 'http://localhost:3000';

// Start server before tests
test.before(async () => {
  serverProcess = exec('node server.js');
  // Espera 1s para o servidor subir
  await new Promise(resolve => setTimeout(resolve, 1000));
});

// Stop server after tests
test.after(() => {
  serverProcess.kill();
});

// Helper para POST JSON
async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res;
}

// Testes GET /api/phrases
test('GET /api/phrases deve retornar array de frases com média e contagem', async () => {
  const res = await fetch(`${baseUrl}/api/phrases`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data));
  assert.strictEqual(data.length, 5);
  for (const item of data) {
    assert.strictEqual(typeof item.phrase, 'string');
    assert.ok(item.averageRating === null || typeof item.averageRating === 'number');
    assert.strictEqual(typeof item.ratingCount, 'number');
  }
});

// Testes POST /api/phrases/ratings
test('POST /api/phrases/ratings aceita avaliação válida e armazena', async () => {
  const body = { phrase: 'Acredite em você e todo o resto virá.', rating: 4 };
  const res = await postJson(`${baseUrl}/api/phrases/ratings`, body);
  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.strictEqual(data.message, 'Avaliação registrada com sucesso' || data.message === 'Avaliação enviada com sucesso!');

  // Verifica se média atualizada
  const res2 = await fetch(`${baseUrl}/api/phrases`);
  const phrases = await res2.json();
  const phraseObj = phrases.find(p => p.phrase === body.phrase);
  assert.ok(phraseObj.averageRating >= 1 && phraseObj.averageRating <= 5);
  assert.ok(phraseObj.ratingCount >= 1);
});

// Teste validação nota inválida
test('POST /api/phrases/ratings rejeita nota fora do intervalo', async () => {
  const body = { phrase: 'Acredite em você e todo o resto virá.', rating: 6 };
  const res = await postJson(`${baseUrl}/api/phrases/ratings`, body);
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.ok(data.errors.some(e => e.msg.includes('entre 1 e 5')));
});

// Teste validação frase inválida
test('POST /api/phrases/ratings rejeita frase inválida', async () => {
  const body = { phrase: 'Frase inexistente', rating: 3 };
  const res = await postJson(`${baseUrl}/api/phrases/ratings`, body);
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.ok(data.errors.some(e => e.msg === 'Frase inválida'));
});

// Teste GET /health
test('GET /health retorna status ok', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.deepStrictEqual(data, { status: 'ok' });
});

// Teste CORS restrito
test('CORS deve restringir origens em produção', async () => {
  if (process.env.NODE_ENV !== 'production') {
    test.skip();
    return;
  }
  const res = await fetch(`${baseUrl}/api/phrases`, { headers: { Origin: 'http://origem-nao-permitida.com' } });
  assert.notStrictEqual(res.status, 200);
});

// Teste rate limiting no POST /api/phrases/ratings
test('Rate limiting deve limitar requisições excessivas', async () => {
  const phrase = 'Acredite em você e todo o resto virá.';
  let lastRes;
  for (let i = 0; i < 35; i++) {
    lastRes = await postJson(`${baseUrl}/api/phrases/ratings`, { phrase, rating: 3 });
  }
  assert.strictEqual(lastRes.status, 429);
  const data = await lastRes.json();
  assert.strictEqual(data.error, 'Limite de requisições atingido. Tente novamente mais tarde.');
});
