import { test, before, beforeEach, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import satiricalGenerator from '../satiricalGenerator.js';
import { readJsonWithRetry, rmWithRetry } from '../test-utils/fs-test-utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.join(projectRoot, 'data');
const historyFile = path.join(dataDir, 'history.json');
const nativeFetch = global.fetch;
const nativeConsoleError = console.error;
const nativeSatiricalGenerator = satiricalGenerator.generateSatiricalPhrase;
const nativeArrayMap = Array.prototype.map;
const nativeSetTimeout = global.setTimeout;

process.env.PORT = '3302';
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'valid-key';

let server;
const baseUrl = 'http://127.0.0.1:3302';

before(async () => {
  server = (await import('../server.js')).default;
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
});

beforeEach(async () => {
  await rmWithRetry(dataDir);
  global.fetch = nativeFetch;
  console.error = nativeConsoleError;
  satiricalGenerator.generateSatiricalPhrase = nativeSatiricalGenerator;
  Array.prototype.map = nativeArrayMap;
  global.setTimeout = nativeSetTimeout;
});

afterEach(async () => {
  await rmWithRetry(dataDir);
  global.fetch = nativeFetch;
  console.error = nativeConsoleError;
  satiricalGenerator.generateSatiricalPhrase = nativeSatiricalGenerator;
  Array.prototype.map = nativeArrayMap;
  global.setTimeout = nativeSetTimeout;
});

function mockExternalFetch(handler) {
  global.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input?.url ?? String(input);
    if (url.includes('/chat/completions')) {
      return handler(input, init);
    }
    return nativeFetch(input, init);
  };
}

test('POST /api/phrases retorna frases sanitizadas quando os dois geradores funcionam', async () => {
  satiricalGenerator.generateSatiricalPhrase = async words => `<script>alert(1)</script>${words.join(' ')}`;
  mockExternalFetch(() => new Response(JSON.stringify({
    choices: [{ message: { content: '<script>alert(1)</script>Continue firme' } }],
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  }));

  const response = await fetch(`${baseUrl}/api/phrases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words: ['  fé  ', 'foco', 'força'] }),
  });

  const body = await response.json();
  const savedHistory = await readJsonWithRetry(historyFile);

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.deepEqual(body.words, ['fé', 'foco', 'força']);
  assert.equal(body.motivationalPhrase, 'Continue firme');
  assert.equal(body.satiricalPhrase, 'fé foco força');
  assert.ok(body.timestamp);
  assert.equal(savedHistory.length, 1);
  assert.equal(savedHistory[0].motivationalPhrase, 'Continue firme');
});

test('POST /api/phrases usa fallback motivacional quando a API externa retorna erro', async () => {
  satiricalGenerator.generateSatiricalPhrase = async () => 'Sátira disponível';
  mockExternalFetch(() => new Response(JSON.stringify({
    error: { message: 'quota excedida' },
  }), {
    status: 429,
    headers: { 'content-type': 'application/json' },
  }));

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

test('POST /api/phrases usa fallback motivacional quando a API externa falha sem JSON válido', async () => {
  satiricalGenerator.generateSatiricalPhrase = async () => 'Sátira disponível';
  mockExternalFetch(() => ({
    ok: false,
    status: 503,
    async json() {
      throw new Error('json inválido');
    },
  }));

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

test('POST /api/phrases usa fallback satírico quando o gerador satírico falha', async () => {
  satiricalGenerator.generateSatiricalPhrase = async () => {
    throw new Error('falha satírica');
  };
  mockExternalFetch(() => new Response(JSON.stringify({
    choices: [{ message: { content: 'Siga em frente.' } }],
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  }));

  const response = await fetch(`${baseUrl}/api/phrases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words: ['fé', 'foco', 'força'] }),
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.motivationalPhrase, 'Siga em frente.');
  assert.equal(body.satiricalPhrase, 'Frase satírica indisponível no momento.');
});


test('POST /api/phrases usa fallback satírico quando ocorre timeout', async () => {
  satiricalGenerator.generateSatiricalPhrase = async () => new Promise(() => {});
  global.setTimeout = (callback, _delay, ...args) => nativeSetTimeout(callback, 0, ...args);
  mockExternalFetch(() => new Response(JSON.stringify({
    choices: [{ message: { content: 'Persista com calma.' } }],
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  }));

  const response = await fetch(`${baseUrl}/api/phrases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words: ['fé', 'foco', 'força'] }),
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.motivationalPhrase, 'Persista com calma.');
  assert.equal(body.satiricalPhrase, 'Frase satírica indisponível no momento.');
});

test('POST /api/phrases continua respondendo sucesso quando salvar histórico falha', async () => {
  const errors = [];
  console.error = (...args) => errors.push(args.join(' '));

  await mkdir(historyFile, { recursive: true });
  satiricalGenerator.generateSatiricalPhrase = async () => 'Sátira salva';
  mockExternalFetch(() => new Response(JSON.stringify({
    choices: [{ message: { content: 'Você vai conseguir.' } }],
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  }));

  const response = await fetch(`${baseUrl}/api/phrases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words: ['fé', 'foco', 'força'] }),
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.ok(errors.some(message => message.includes('[History Error]')));
});

test('POST /api/phrases responde 500 quando ocorre erro inesperado no processamento', async () => {
  const errors = [];
  console.error = (...args) => errors.push(args.join(' '));

  Array.prototype.map = function patchedMap(callback, thisArg) {
    if (Array.isArray(this) && this.length === 3 && this[0] === 'amor' && this[1] === 'fé' && this[2] === 'foco') {
      throw new Error('falha inesperada no map');
    }
    return nativeArrayMap.call(this, callback, thisArg);
  };

  const response = await fetch(`${baseUrl}/api/phrases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words: ['amor', 'fé', 'foco'] }),
  });

  assert.equal(response.status, 500);
  assert.equal((await response.json()).error, 'Erro interno do servidor.');
  assert.ok(errors.some(message => message.includes('[API Error]')));
});

test('servidor com chave configurada sobe corretamente', async () => {
  assert.equal(typeof server.close, 'function');
});
