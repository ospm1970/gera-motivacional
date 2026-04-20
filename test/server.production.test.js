import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.PORT = '3303';
process.env.NODE_ENV = 'production';
process.env.OPENAI_API_KEY = 'valid-key';
process.env.ALLOWED_ORIGIN = 'https://cliente.exemplo';

const baseUrl = 'http://127.0.0.1:3303';

let server;

before(async () => {
  server = (await import('../server.js')).default;
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
});

test('modo production aplica CORS restrito ao domínio permitido', async () => {
  const response = await fetch(`${baseUrl}/health`, {
    headers: { Origin: 'https://cliente.exemplo' },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://cliente.exemplo');
});
