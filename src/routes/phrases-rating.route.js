import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { logger } from '../logger.js';

const router = express.Router();

// Middleware para autenticação JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token não fornecido' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn({ message: 'Token inválido', error: err.message });
      return res.status(403).json({ message: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}

/**
 * POST /api/phrases/rating
 * Recebe avaliação da frase pelo usuário autenticado.
 */
router.post(
  '/rating',
  authenticateToken,
  body('phraseId').isUUID().withMessage('phraseId deve ser UUID válido'),
  body('rating')
    .isInt({ min: 0, max: 5 })
    .withMessage('rating deve ser inteiro entre 0 e 5'),
  async (req, res) => {
    const correlationId = req.headers['x-correlation-id'] || '';
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn({
        message: 'Validação falhou na avaliação de frase',
        errors: errors.array(),
        userId: req.user.id,
        correlationId
      });
      return res.status(400).json({ errors: errors.array() });
    }

    const { phraseId, rating } = req.body;
    const userId = req.user.id;

    try {
      const queryText = `
        INSERT INTO phrase_ratings (user_id, phrase_id, rating, created_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_id, phrase_id) DO UPDATE SET rating = EXCLUDED.rating, created_at = NOW()
        RETURNING *;
      `;

      const result = await pool.query(queryText, [userId, phraseId, rating]);

      logger.info({
        message: 'Avaliação de frase armazenada',
        userId,
        phraseId,
        rating,
        correlationId
      });

      return res.status(200).json({ message: 'Avaliação registrada com sucesso' });
    } catch (error) {
      logger.error({
        message: 'Erro ao armazenar avaliação de frase',
        error: error.message,
        userId,
        phraseId,
        correlationId
      });
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
);

export default router;
