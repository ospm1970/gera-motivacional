import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import phrasesRatingRouter from './routes/phrases-rating.route.js';
import { logger } from './logger.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Middleware para log básico de requisições
app.use((req, res, next) => {
  logger.info({ message: 'Incoming request', method: req.method, path: req.path, ip: req.ip });
  next();
});

// Rotas existentes...
// app.use('/api/phrases', phrasesRouter);
// app.use('/api/history', historyRouter);

// Nova rota para avaliação de frases
app.use('/api/phrases', phrasesRatingRouter);

// Middleware de tratamento de erros genérico
app.use((err, req, res, next) => {
  logger.error({ message: 'Unhandled error', error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info({ message: `Server running on port ${PORT}` });
});
