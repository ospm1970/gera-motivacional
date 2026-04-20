import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.PORT = '3304';
process.env.NODE_ENV = 'production';
process.env.OPENAI_API_KEY = 'valid-key';
delete process.env.ALLOWED_ORIGIN;

const baseUrl = 'http://127.0.0.1:3304';

let server;

before(async () => {
  server = (await import('../server.js')).default;
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
});

test('modo production usa a origem padrão quando ALLOWED_ORIGIN não está definida', async () => {
  const response = await fetch(`${baseUrl}/health`, {
    headers: { Origin: 'https://seudominio.com' },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://seudominio.com');
});
