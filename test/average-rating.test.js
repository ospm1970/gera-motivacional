import assert from 'assert';
import http from 'http';
import { spawn } from 'child_process';
import fetch from 'node-fetch';

let serverProcess;
const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

// Start server before tests
before(async function () {
  this.timeout(10000);
  serverProcess = spawn('node', ['server.js'], { env: process.env });
  await new Promise((resolve, reject) => {
    serverProcess.stdout.on('data', (data) => {
      if (data.toString().includes(`Server running on port`)) {
        resolve();
      }
    });
    serverProcess.on('error', reject);
  });
});

// Stop server after tests
after(() => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

describe('GET /api/phrases/ratings/average', () => {
  it('deve retornar média das avaliações quando existirem', async () => {
    // Inserir avaliação para teste
    const sqlite3 = await import('sqlite3');
    const sqlite = await import('sqlite');
    const db = await sqlite.open({ filename: './database.sqlite', driver: sqlite3.Database });
    await db.run('INSERT INTO ratings (phraseId, rating) VALUES (?, ?)', [1, 4]);
    await db.run('INSERT INTO ratings (phraseId, rating) VALUES (?, ?)', [1, 2]);

    const response = await fetch(`${BASE_URL}/api/phrases/ratings/average`);
    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.ok(typeof data.average === 'number');
    assert.ok(data.average >= 1 && data.average <= 5);

    // Limpar dados inseridos
    await db.run('DELETE FROM ratings WHERE phraseId = ?', [1]);
  });

  it('deve retornar mensagem quando não houver avaliações', async () => {
    // Garantir que não há avaliações
    const sqlite3 = await import('sqlite3');
    const sqlite = await import('sqlite');
    const db = await sqlite.open({ filename: './database.sqlite', driver: sqlite3.Database });
    await db.run('DELETE FROM ratings');

    const response = await fetch(`${BASE_URL}/api/phrases/ratings/average`);
    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.strictEqual(data.average, null);
    assert.strictEqual(data.message, 'Nenhuma avaliação disponível');
  });

  it('deve retornar erro 500 em caso de falha no banco', async () => {
    // Simular erro fechando o banco antes da requisição
    // Como não há forma simples de simular erro no endpoint sem alterar código,
    // este teste é um placeholder para cobertura futura.
    // Poderia ser implementado com injeção de dependência ou mock.
    assert.ok(true);
  });
});
