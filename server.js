import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { body, validationResult } from 'express-validator';
import sanitizeHtml from 'sanitize-html';
import satiricalGenerator from './satiricalGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARES DE SEGURANÇA E CONFIGURAÇÃO
// ==========================================
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://seudominio.com' : '*',
  methods: ['GET', 'POST']
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// RATE LIMITING
// ==========================================
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================
async function generateMotivationalPhrase(words) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada');
  }

  const prompt = `Crie uma frase motivacional em português que incorpore as seguintes 3 palavras: ${words.join(', ')}. 
A frase deve:
- Ser inspiradora e motivadora
- Ter entre 15 e 30 palavras
- Incorporar naturalmente as 3 palavras
- Ser apropriada para qualquer contexto
Responda apenas com a frase.`;

  try {
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
  } catch (error) {
    console.error('[OpenAI Error]:', error.message);
    throw new Error('Falha ao gerar frase motivacional.');
  }
}

// ==========================================
// ENDPOINTS
// ==========================================

// ✅ ENDPOINT CORRIGIDO: /api/phrases (não /api/motivational-phrase)
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

      // ✅ RESPOSTA CORRIGIDA: retorna motivationalPhrase (não phrase)
      return res.json({
        success: true,
        words,
        motivationalPhrase,
        satiricalPhrase,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[API Error]:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fallback para SPA (React)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==========================================
// INICIALIZAÇÃO
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🛡️  Ambiente: ${process.env.NODE_ENV || 'development'}`);
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  AVISO: OPENAI_API_KEY não está configurada!');
  }
});


/* Frontend React Component */
import React, { useState } from 'react';

/**
 * Component: PhraseGenerator
 * Renders the UI for generating personalized phrases
 * Allows user to input words, select phrase type, and displays generated phrase
 */
export default function PhraseGenerator() {
  const [words, setWords] = useState('');
  const [type, setType] = useState('Motivacional');
  const [phrase, setPhrase] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Validate input and send request to backend
  async function handleGeneratePhrase(e) {
    e.preventDefault();
    setError('');
    setPhrase('');

    // Validate type selection
    if (type !== 'Motivacional' && type !== 'Satírica') {
      setError('Tipo inválido selecionado.');
      return;
    }

    // Validate words input
    if (!words.trim()) {
      setError('Por favor, insira palavras para gerar a frase.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/phrases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: words.trim(), tipo: type })
      });

      if (!response.ok) {
        const err = await response.json();
        setError(err.message || 'Erro ao gerar frase.');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setPhrase(data.phrase);
    } catch (ex) {
      setError('Erro de comunicação com o servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h1 style={{ fontWeight: 'bold', fontSize: '1.8rem', marginBottom: 20 }} aria-label="Título da tela">Geração de Frases Personalizadas</h1>
      <form onSubmit={handleGeneratePhrase} aria-label="Formulário de geração de frases">
        <label htmlFor="wordsInput">Palavras para frase</label>
        <input
          id="wordsInput"
          type="text"
          value={words}
          onChange={(e) => setWords(e.target.value)}
          placeholder="Digite palavras separadas por espaço"
          aria-required="true"
          style={{ width: '100%', padding: 8, marginBottom: 12, fontSize: '1rem' }}
        />

        <label htmlFor="typeSelect" style={{ display: 'block', marginBottom: 4 }}>Tipo de frase</label>
        <select
          id="typeSelect"
          value={type}
          onChange={(e) => setType(e.target.value)}
          required
          aria-required="true"
          style={{ width: '100%', padding: 8, marginBottom: 20, fontSize: '1rem' }}
        >
          <option value="Motivacional">Motivacional</option>
          <option value="Satírica">Satírica</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          style={{ padding: '10px 20px', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer' }}
          aria-busy={loading}
        >
          {loading ? 'Gerando...' : 'Gerar Frase'}
        </button>
      </form>

      {error && <div role="alert" style={{ color: 'red', marginTop: 16 }}>{error}</div>}
      {phrase && <blockquote style={{ marginTop: 20, fontSize: '1.2rem', fontStyle: 'italic' }} aria-live="polite">{phrase}</blockquote>}
    </main>
  );
}

/* Backend Node.js Express API */
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

/**
 * Generates a motivational phrase based on input words
 * @param {string} words
 * @returns {string}
 */
function generateMotivationalPhrase(words) {
  // Simple motivational phrase generation logic
  const base = 'Acredite em si mesmo e '; 
  return `${base}${words}. Você pode alcançar tudo!`;
}

/**
 * Generates a satirical phrase based on input words
 * @param {string} words
 * @returns {string}
 */
function generateSatiricalPhrase(words) {
  // Satirical phrase generation logic
  const base = 'Com certeza, '; 
  return `${base}${words}, mas não conte muito com isso...`;
}

/**
 * Middleware to sanitize input strings
 * @param {string} input
 * @returns {string}
 */
function sanitizeInput(input) {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {}
  }).trim();
}

/**
 * POST /api/phrases
 * Request body: { words: string, tipo: 'Motivacional' | 'Satírica' }
 * Response: { phrase: string }
 */
router.post(
  '/phrases',
  // Input validation and sanitization
  body('words').isString().trim().notEmpty().escape(),
  body('tipo').isIn(['Motivacional', 'Satírica']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Parâmetros inválidos.', errors: errors.array() });
    }

    // Sanitize inputs
    const rawWords = req.body.words;
    const tipo = req.body.tipo;
    const words = sanitizeInput(rawWords);

    if (!words) {
      return res.status(400).json({ message: 'Palavras inválidas após sanitização.' });
    }

    try {
      const start = Date.now();
      let phrase = '';

      if (tipo === 'Motivacional') {
        phrase = generateMotivationalPhrase(words);
      } else if (tipo === 'Satírica') {
        phrase = generateSatiricalPhrase(words);
      } else {
        return res.status(400).json({ message: 'Tipo de frase inválido.' });
      }

      const duration = Date.now() - start;
      if (duration > 2000) {
        console.warn(`Geração de frase demorou ${duration}ms`);
      }

      res.json({ phrase });
    } catch (error) {
      res.status(500).json({ message: 'Erro interno ao gerar frase.' });
    }
  }
);

module.exports = { router, generateSatiricalPhrase, generateMotivationalPhrase };