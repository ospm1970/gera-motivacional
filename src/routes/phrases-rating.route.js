import express from 'express';
import { body, validationResult, sanitizeBody } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { pool } from '../db.js';
import { logger } from '../logger.js';

const router = express.Router();

// Rate limiter: max 10 requests per minute per IP
const ratingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  handler: (req, res) => {
    logger.warn({
      message: 'Rate limit exceeded on /api/phrases/rating',
      ip: req.ip,
      path: req.originalUrl
    });
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  }
});

// Middleware to measure response time
router.use('/rating', (req, res, next) => {
  const startHrTime = process.hrtime();
  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
    logger.info({
      message: 'Request processed',
      path: req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
      responseTimeMs: elapsedMs.toFixed(3),
      ip: req.ip
    });
  });
  next();
});

router.post(
  '/rating',
  ratingLimiter,
  body('phraseId').isUUID().withMessage('phraseId must be a valid UUID'),
  body('rating')
    .isInt({ min: 0, max: 5 })
    .withMessage('rating must be an integer between 0 and 5'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn({
        message: 'Validation failed on /api/phrases/rating',
        errors: errors.array(),
        ip: req.ip
      });
      return res.status(400).json({ errors: errors.array() });
    }

    const { phraseId, rating } = req.body;

    try {
      // Persist rating with timestamp, no user data to guarantee anonimity
      const query = 'INSERT INTO phrase_ratings (phrase_id, rating, created_at) VALUES ($1, $2, NOW()) RETURNING id';
      const values = [phraseId, rating];
      const result = await pool.query(query, values);

      logger.info({
        message: 'Rating saved successfully',
        phraseId,
        rating,
        ratingId: result.rows[0].id,
        ip: req.ip
      });

      return res.status(201).json({ message: 'Avaliação registrada com sucesso.' });
    } catch (error) {
      logger.error({
        message: 'Error saving rating',
        error: error.message,
        ip: req.ip
      });
      return res.status(500).json({ error: 'Erro interno ao salvar avaliação.' });
    }
  }
);

export default router;
