import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

delete process.env.PORT;
delete process.env.NODE_ENV;
delete process.env.OPENAI_API_KEY;

const baseUrl = 'http://127.0.0.1:3000';

let server;

before(async () => {
  server = (await import('../server.js')).default;
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
});

test('servidor usa porta e ambiente padrão quando variáveis não estão definidas', async () => {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, 'ok');
});
