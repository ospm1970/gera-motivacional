import request from 'supertest';
import express from 'express';
import phrasesRatingRouter from './phrases-rating.route.js';
import { pool } from '../db.js';

jest.mock('../db.js', () => ({
  pool: {
    query: jest.fn()
  }
}));

const app = express();
app.use(express.json());
app.use('/api/phrases', phrasesRatingRouter);

describe('POST /api/phrases/rating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve aceitar avaliação válida e retornar 201', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 'rating-123' }] });

    const res = await request(app)
      .post('/api/phrases/rating')
      .send({ phraseId: '11111111-1111-1111-1111-111111111111', rating: 4 });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ message: 'Avaliação registrada com sucesso.' });
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO phrase_ratings'),
      ['11111111-1111-1111-1111-111111111111', 4]
    );
  });

  it('deve rejeitar avaliação com rating fora do intervalo', async () => {
    const res = await request(app)
      .post('/api/phrases/rating')
      .send({ phraseId: '11111111-1111-1111-1111-111111111111', rating: 6 });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].msg).toBe('rating must be an integer between 0 and 5');
  });

  it('deve rejeitar avaliação com phraseId inválido', async () => {
    const res = await request(app)
      .post('/api/phrases/rating')
      .send({ phraseId: 'invalid-uuid', rating: 3 });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].msg).toBe('phraseId must be a valid UUID');
  });

  it('deve retornar 500 em erro de banco de dados', async () => {
    pool.query.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/api/phrases/rating')
      .send({ phraseId: '11111111-1111-1111-1111-111111111111', rating: 2 });

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Erro interno ao salvar avaliação.');
  });

  it('deve aplicar rate limiting', async () => {
    // Simular 11 requisições para exceder limite de 10 por minuto
    pool.query.mockResolvedValue({ rows: [{ id: 'rating-123' }] });

    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/api/phrases/rating')
        .send({ phraseId: '11111111-1111-1111-1111-111111111111', rating: 3 });
    }

    const res = await request(app)
      .post('/api/phrases/rating')
      .send({ phraseId: '11111111-1111-1111-1111-111111111111', rating: 3 });

    expect(res.statusCode).toBe(429);
    expect(res.body.error).toBe('Too many requests, please try again later.');
  });
});
