import OpenAI from 'openai';
import sanitizeHtml from 'sanitize-html';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

async function generateSatiricalPhrase(words) {
  const prompt = `Gere uma frase satírica em português usando estas três palavras: ${words.join(', ')}. 
O tom deve ser claramente satírico, sarcástico, mas não ofensivo ou desrespeitoso.
Máximo de 30 palavras. Responda apenas com a frase.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Modelo disponível e confiável
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 60,
      temperature: 0.8
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error('Resposta inválida do ChatGPT');
    }

    const phrase = response.choices[0].message.content.trim();
    return sanitizeHtml(phrase);
  } catch (error) {
    console.error('[Satirical Generator Error]:', error.message);
    throw new Error('Falha ao gerar frase satírica.');
  }
}

// Exportação ES Module correta
export default { generateSatiricalPhrase };
