import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

// Função para chamar OpenAI API
async function generateMotivationalPhrase(words) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não está configurada');
  }

  const wordList = words.join(', ');
  
  const prompt = `Crie uma frase motivacional em português que incorpore as seguintes 3 palavras: ${wordList}. 
    
A frase deve:
- Ser inspiradora e motivadora
- Ter entre 15 e 30 palavras
- Incorporar naturalmente as 3 palavras fornecidas
- Ser apropriada para qualquer contexto

Responda apenas com a frase, sem explicações adicionais.`;

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
          {
            role: 'system',
            content: 'Você é um gerador de frases motivacionais em português.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      if (response.status === 401) {
        throw new Error('Chave de API OpenAI inválida');
      }
      
      if (response.status === 429) {
        throw new Error('Limite de requisições da API OpenAI atingido. Tente novamente mais tarde.');
      }

      throw new Error(errorData.error?.message || 'Erro ao chamar API OpenAI');
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Resposta inválida da API OpenAI');
    }

    return data.choices[0].message.content.trim();
  } catch (error) {
    if (error.message.includes('fetch')) {
      throw new Error('Erro de conexão com a API OpenAI. Verifique sua internet.');
    }
    throw error;
  }
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

    // Gerar frase motivacional
    const phrase = await generateMotivationalPhrase(cleanedWords);

    // Verificar se a frase contém as palavras
    const phraseUpperCase = phrase.toUpperCase();
    const wordsNotFound = cleanedWords.filter(
      word => !phraseUpperCase.includes(word.toUpperCase())
    );

    if (wordsNotFound.length > 0) {
      console.warn(`Palavras não encontradas na frase: ${wordsNotFound.join(', ')}`);
      // Continuar mesmo se algumas palavras não forem encontradas
      // pois a API pode gerar frases válidas sem todas as palavras
    }

    res.json({
      success: true,
      words: cleanedWords,
      phrase: phrase,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao gerar frase motivacional:', error);
    
    if (error.message.includes('Chave de API OpenAI inválida')) {
      return res.status(401).json({ error: 'Chave de API OpenAI inválida' });
    }
    
    if (error.message.includes('Limite de requisições')) {
      return res.status(429).json({ error: error.message });
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
