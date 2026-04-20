import { test, before, beforeEach, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import satiricalGenerator from '../satiricalGenerator.js';
import { rmWithRetry } from '../test-utils/fs-test-utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.join(projectRoot, 'data');
const historyFile = path.join(dataDir, 'history.json');
const indexFile = path.join(projectRoot, 'public', 'index.html');
const nativeConsoleError = console.error;
const nativeSatiricalGenerator = satiricalGenerator.generateSatiricalPhrase;

process.env.PORT = '3301';
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = '';

action();

function action() {}

let server;
const baseUrl = 'http://127.0.0.1:3301';

before(async () => {
  server = (await import('../server.js')).default;
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
});

beforeEach(async () => {
  await rmWithRetry(dataDir);
  console.error = nativeConsoleError;
  satiricalGenerator.generateSatiricalPhrase = nativeSatiricalGenerator;
});

afterEach(async () => {
  await rmWithRetry(dataDir);
  console.error = nativeConsoleError;
  satiricalGenerator.generateSatiricalPhrase = nativeSatiricalGenerator;
});

test('GET /health retorna status ok', async () => {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, 'ok');
  assert.ok(body.timestamp);
});

test('POST /api/phrases valida body ausente', async () => {
  const response = await fetch(`${baseUrl}/api/phrases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /3 palavras/i);
});

test('POST /api/phrases valida caracteres inválidos', async () => {
  const response = await fetch(`${baseUrl}/api/phrases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words: ['amor123', 'fé', 'esperança'] }),
  });

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /apenas letras/i);
});


test('POST /api/phrases valida quantidade insuficiente de palavras', async () => {
  const response = await fetch(`${baseUrl}/api/phrases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words: ['fé', 'foco'] }),
  });

  assert.equal(response.status, 400);
});


test('POST /api/phrases valida quantidade excessiva de palavras', async () => {
  const response = await fetch(`${baseUrl}/api/phrases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words: ['fé', 'foco', 'força', 'extra'] }),
  });

  assert.equal(response.status, 400);
});

test('POST /api/phrases valida palavras vazias', async () => {
  const response = await fetch(`${baseUrl}/api/phrases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words: ['', 'fé', 'foco'] }),
  });

  assert.equal(response.status, 400);
});

test('POST /api/phrases rejeita item que não é string', async () => {
  const response = await fetch(`${baseUrl}/api/phrases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words: [123, 'fé', 'foco'] }),
  });

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /não podem estar vazias/i);
});

test('POST /api/phrases usa fallback motivacional quando a chave da OpenAI não está configurada', async () => {
  satiricalGenerator.generateSatiricalPhrase = async () => 'Sátira disponível';

  const response = await fetch(`${baseUrl}/api/phrases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words: ['fé', 'foco', 'força'] }),
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.motivationalPhrase, 'Frase motivacional indisponível no momento.');
  assert.equal(body.satiricalPhrase, 'Sátira disponível');
});

test('GET /api/history retorna entradas respeitando o limite informado', async () => {
  await mkdir(dataDir, { recursive: true });
  await writeFile(historyFile, JSON.stringify([
    { words: ['a', 'b', 'c'] },
    { words: ['d', 'e', 'f'] },
  ]), 'utf-8');

  const response = await fetch(`${baseUrl}/api/history?limit=1`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.count, 1);
  assert.equal(body.entries.length, 1);
});

test('GET /api/history limita o máximo a 100 entradas', async () => {
  await mkdir(dataDir, { recursive: true });
  await writeFile(historyFile, JSON.stringify(Array.from({ length: 120 }, (_, index) => ({ id: index + 1 }))), 'utf-8');

  const response = await fetch(`${baseUrl}/api/history?limit=999`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.count, 100);
  assert.equal(body.entries.length, 100);
});

test('GET /api/history responde 500 quando o histórico carregado é inválido', async () => {
  const errors = [];
  console.error = (...args) => errors.push(args.join(' '));

  await mkdir(dataDir, { recursive: true });
  await writeFile(historyFile, '{}', 'utf-8');

  const response = await fetch(`${baseUrl}/api/history`);
  const body = await response.json();

  assert.equal(response.status, 500);
  assert.equal(body.error, 'Erro ao recuperar histórico.');
  assert.ok(errors.some(message => message.includes('[History Error]')));
});

test('GET rota fallback entrega o index.html da aplicação', async () => {
  const response = await fetch(`${baseUrl}/rota-inexistente`);
  const html = await response.text();
  const indexHtml = await readFile(indexFile, 'utf-8');

  assert.equal(response.status, 200);
  assert.equal(html, indexHtml);
});

test('servidor fecha adequadamente ao final da suíte', async () => {
  assert.equal(typeof server.close, 'function');
});
