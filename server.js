import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração CORS restrita conforme variável de ambiente
const corsOrigin = process.env.CORS_ORIGIN || '';
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // permitir curl, postman
    if (process.env.NODE_ENV === 'production') {
      if (origin === corsOrigin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      callback(null, true); // liberar em dev
    }
  }
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Banco SQLite para avaliações
let db;
(async () => {
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phrase TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5)
    );
  `);
})();

// Lista fixa de frases para validação e exibição
const phrases = [
  'Acredite em você e todo o resto virá.',
  'O sucesso é a soma de pequenos esforços repetidos dia após dia.',
  'Não espere por oportunidades, crie-as.',
  'A persistência é o caminho do êxito.',
  'Transforme seus sonhos em planos e seus planos em realidade.'
];

// Logger simples estruturado
function logEvent(event, details) {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({ timestamp, event, ...details }));
}

// Rate limiter para POST /api/phrases/ratings
const ratingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30,
  message: { error: 'Limite de requisições atingido. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false
});

// GET /api/phrases - retorna frases com média e contagem de avaliações
app.get('/api/phrases', async (req, res) => {
  try {
    const result = [];
    for (const phrase of phrases) {
      const row = await db.get(
        'SELECT AVG(rating) as averageRating, COUNT(rating) as ratingCount FROM ratings WHERE phrase = ?',
        phrase
      );
      result.push({
        phrase,
        averageRating: row.averageRating !== null ? Number(row.averageRating.toFixed(2)) : null,
        ratingCount: row.ratingCount || 0
      });
    }
    logEvent('phrases_listed', { count: result.length });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno ao buscar frases' });
  }
});

// POST /api/phrases/ratings - recebe e armazena avaliação
app.post(
  '/api/phrases/ratings',
  ratingLimiter,
  body('phrase').isString().custom(value => phrases.includes(value)).withMessage('Frase inválida'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Nota deve ser entre 1 e 5'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logEvent('rating_validation_failed', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const { phrase, rating } = req.body;
    try {
      await db.run('INSERT INTO ratings (phrase, rating) VALUES (?, ?)', phrase, rating);
      logEvent('rating_created', { phrase, rating });
      res.status(201).json({ message: 'Avaliação registrada com sucesso' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro interno ao salvar avaliação' });
    }
  }
);

// GET /health
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Fallback para frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
