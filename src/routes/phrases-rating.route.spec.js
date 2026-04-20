import request from 'supertest';
import express from 'express';
import phrasesRatingRouter from './phrases-rating.route.js';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use('/api/phrases', phrasesRatingRouter);

// Mock pool
import { pool } from '../db.js';
jest.mock('../db.js');

const mockUser = { id: '11111111-1111-1111-1111-111111111111' };
const validToken = jwt.sign(mockUser, process.env.JWT_SECRET || 'testsecret');

describe('POST /api/phrases/rating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 401 se não enviar token', async () => {
    const res = await request(app).post('/api/phrases/rating').send({ phraseId: '00000000-0000-0000-0000-000000000000', rating: 3 });
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Token não fornecido');
  });

  it('deve retornar 400 para rating inválido', async () => {
    const res = await request(app)
      .post('/api/phrases/rating')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ phraseId: '00000000-0000-0000-0000-000000000000', rating: 6 });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].msg).toBe('rating deve ser inteiro entre 0 e 5');
  });

  it('deve retornar 400 para phraseId inválido', async () => {
    const res = await request(app)
      .post('/api/phrases/rating')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ phraseId: 'invalid-uuid', rating: 3 });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].msg).toBe('phraseId deve ser UUID válido');
  });

  it('deve armazenar avaliação e retornar 200', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1 }] });
    const res = await request(app)
      .post('/api/phrases/rating')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ phraseId: '00000000-0000-0000-0000-000000000000', rating: 4 });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Avaliação registrada com sucesso');
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('deve retornar 500 em erro interno', async () => {
    pool.query.mockRejectedValue(new Error('DB error'));
    const res = await request(app)
      .post('/api/phrases/rating')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ phraseId: '00000000-0000-0000-0000-000000000000', rating: 3 });
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Erro interno do servidor');
  });
});
