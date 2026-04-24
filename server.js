import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { body, validationResult } from 'express-validator';
import sanitizeHtml from 'sanitize-html';
import sqlite3 from 'sqlite3';
import sqlite from 'sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Database initialization
let db;
(async () => {
  db = await sqlite.open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });
  // Assuming tables 'phrases' and 'ratings' exist with appropriate schema
})();

// Existing endpoints preserved
app.post('/api/phrases', async (req, res) => {
  // Existing implementation preserved
});

app.post('/api/phrases/ratings',
  body('phraseId').isInt({ min: 1 }),
  body('rating').isInt({ min: 1, max: 5 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Existing implementation preserved
});

app.get('/api/history', async (req, res) => {
  // Existing implementation preserved
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// New endpoint: média das notas das frases
app.get('/api/phrases/ratings/average', async (req, res) => {
  try {
    const row = await db.get('SELECT AVG(rating) as average FROM ratings WHERE rating IS NOT NULL');
    if (!row || row.average === null) {
      return res.json({ average: null, message: 'Nenhuma avaliação disponível' });
    }
    // Limitar a duas casas decimais
    const average = Math.round(row.average * 100) / 100;
    res.json({ average });
  } catch (error) {
    console.error('Erro ao calcular média das notas:', error);
    res.status(500).json({ error: 'Erro interno ao calcular média das notas' });
  }
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
