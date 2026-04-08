import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validar palavras
function validateWords(words) {
  if (!Array.isArray(words) || words.length !== 3) {
    return { valid: false, error: 'Deve fornecer exatamente 3 palavras' };
  }

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    if (typeof word !== 'string' || word.trim().length === 0) {
      return { valid: false, error: `Palavra ${i + 1} é inválida ou vazia` };
    }

    // Validar se contém apenas letras (português)
    const portugueseWordRegex = /^[a-záàâãéèêíïóôõöúçñ\s-]+$/i;
    if (!portugueseWordRegex.test(word.trim())) {
      return { valid: false, error: `Palavra "${word}" contém caracteres inválidos. Use apenas letras portuguesas.` };
    }
  }

  return { valid: true };
}

// Endpoint para gerar frase motivacional
app.post('/api/motivational-phrase', async (req, res) => {
  try {
    const { words } = req.body;

    // Validar entrada
    const validation = validateWords(words);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const cleanedWords = words.map(w => w.trim());
    const wordList = cleanedWords.join(', ');

    // Criar prompt para o ChatGPT
    const prompt = `Crie uma frase motivacional em português que incorpore as seguintes 3 palavras: ${wordList}. 
    
A frase deve:
- Ser inspiradora e motivadora
- Ter entre 15 e 30 palavras
- Incorporar naturalmente as 3 palavras fornecidas
- Ser apropriada para qualquer contexto

Responda apenas com a frase, sem explicações adicionais.`;

    // Chamar OpenAI API
    const message = await openai.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 150,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const phrase = message.content[0].type === 'text' ? message.content[0].text : '';

    // Verificar se a frase contém as palavras
    const phraseUpperCase = phrase.toUpperCase();
    const wordsNotFound = cleanedWords.filter(
      word => !phraseUpperCase.includes(word.toUpperCase())
    );

    if (wordsNotFound.length > 0) {
      return res.status(500).json({
        error: `A frase gerada não contém todas as palavras fornecidas. Palavras faltantes: ${wordsNotFound.join(', ')}`,
      });
    }

    res.json({
      success: true,
      words: cleanedWords,
      phrase: phrase.trim(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao gerar frase motivacional:', error);
    
    if (error.status === 401) {
      return res.status(401).json({ error: 'Chave de API OpenAI inválida' });
    }
    
    if (error.status === 429) {
      return res.status(429).json({ error: 'Limite de requisições da API OpenAI atingido. Tente novamente mais tarde.' });
    }

    res.status(500).json({
      error: 'Erro ao gerar frase motivacional. Tente novamente mais tarde.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Endpoint de health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Servir página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Gerador de Frases Motivacionais`);
  console.log(`📍 Rodando em http://localhost:${PORT}`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Configurada' : 'NÃO CONFIGURADA'}`);
});
