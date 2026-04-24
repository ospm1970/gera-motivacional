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
import { open } from 'sqlite';
import satiricalGenerator from './satiricalGenerator.js';
import { addEntry, getHistory } from './history.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? (process.env.ALLOWED_ORIGIN || 'https://seudominio.com') : '*',
  methods: ['GET', 'POST']
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

async function generateMotivationalPhrase(words) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurada');

  const prompt = `Crie uma frase motivacional em português que incorpore as seguintes 3 palavras: ${words.join(', ')}.
A frase deve:
- Ser inspiradora e motivadora
- Ter entre 15 e 30 palavras
- Incorporar naturalmente as 3 palavras
- Ser apropriada para qualquer contexto
Responda apenas com a frase.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Você é um gerador de frases motivacionais em português.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 150,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erro da API: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// ==========================================
// ENDPOINTS
// ==========================================

app.post(
  '/api/phrases',
  [
    body('words')
      .isArray({ min: 3, max: 3 }).withMessage('Exatamente 3 palavras são obrigatórias.')
      .custom((arr) => arr.every(w => typeof w === 'string' && w.trim().length > 0))
      .withMessage('As palavras não podem estar vazias.')
      .custom((arr) => arr.every(w => /^[a-záàâãéèêíïóôõöúçñ\s-]+$/i.test(w.trim())))
      .withMessage('As palavras devem conter apenas letras (português).')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      const words = req.body.words.map(w => sanitizeHtml(w.trim()));

      const [motivationalResult, satiricalResult] = await Promise.allSettled([
        generateMotivationalPhrase(words),
        Promise.race([
          satiricalGenerator.generateSatiricalPhrase(words),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout na frase satírica')), 5000))
        ])
      ]);

      const motivationalPhrase = motivationalResult.status === 'fulfilled'
        ? sanitizeHtml(motivationalResult.value)
        : 'Frase motivacional indisponível no momento.';

      const satiricalPhrase = satiricalResult.status === 'fulfilled'
        ? sanitizeHtml(satiricalResult.value)
        : 'Frase satírica indisponível no momento.';

      const timestamp = new Date().toISOString();

      await addEntry({ words, motivationalPhrase, satiricalPhrase, timestamp }).catch(
        err => console.error('[History Error]:', err.message)
      );

      return res.json({ success: true, words, motivationalPhrase, satiricalPhrase, timestamp });

    } catch (error) {
      console.error('[API Error]:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }
);

app.post(
  '/api/phrases/ratings',
  [
    body('phrase').isString().notEmpty().withMessage('Frase é obrigatória.'),
    body('phraseType').isIn(['motivational', 'satirical']).withMessage('Tipo deve ser motivational ou satirical.'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Nota deve ser entre 1 e 5.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { phrase, phraseType, rating } = req.body;
    try {
      await db.run(
        'INSERT INTO ratings (phrase, phrase_type, rating) VALUES (?, ?, ?)',
        sanitizeHtml(phrase), phraseType, rating
      );
      res.status(201).json({ message: 'Avaliação registrada com sucesso.' });
    } catch (error) {
      console.error('[Rating Error]:', error);
      res.status(500).json({ error: 'Erro ao salvar avaliação.' });
    }
  }
);

app.get('/api/phrases/ratings/average', async (req, res) => {
  try {
    const row = await db.get('SELECT AVG(rating) as average FROM ratings WHERE rating IS NOT NULL');
    if (!row || row.average === null) {
      return res.json({ average: null, message: 'Nenhuma avaliação disponível.' });
    }
    res.json({ average: Math.round(row.average * 100) / 100 });
  } catch (error) {
    console.error('[Average Error]:', error);
    res.status(500).json({ error: 'Erro ao calcular média das avaliações.' });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const entries = await getHistory(limit);
    res.json({ success: true, count: entries.length, entries });
  } catch (error) {
    console.error('[History Error]:', error);
    res.status(500).json({ error: 'Erro ao recuperar histórico.' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==========================================
// INICIALIZAÇÃO — DB primeiro, depois server
// ==========================================
let db;

async function start() {
  db = await open({ filename: './database.sqlite', driver: sqlite3.Database });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phrase TEXT NOT NULL,
      phrase_type TEXT NOT NULL CHECK(phrase_type IN ('motivational', 'satirical')),
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🛡️  Ambiente: ${process.env.NODE_ENV || 'development'}`);
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️  AVISO: OPENAI_API_KEY não está configurada!');
    }
  });

  return server;
}

const server = await start();
export default server;
