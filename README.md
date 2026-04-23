# ✨ Gerador de Frases Motivacionais e Satíricas

Aplicação web que solicita 3 palavras do usuário e gera tanto uma frase motivacional inspiradora quanto uma frase satírica (sarcástica) em português, usando a API do ChatGPT.

## 🎯 Funcionalidades

- ✅ Interface intuitiva e responsiva
- ✅ Solicita 3 palavras em português
- ✅ Gera frases motivacionais personalizadas usando ChatGPT
- ✅ Gera frases satíricas e sarcásticas usando ChatGPT
- ✅ Histórico das últimas 100 frases geradas
- ✅ Validação de entrada em tempo real e no backend
- ✅ Tratamento de erros robusto e timeouts de API
- ✅ Design moderno com Tailwind CSS
- ✅ API REST robusta com segurança (Helmet, Rate Limit, Sanitização)

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Chave de API do OpenAI (https://platform.openai.com/api-keys)

### Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/ospm1970/gera-motivacional.git
   cd gera-motivacional
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env
   ```

4. **Adicione sua chave de API do OpenAI**
   ```bash
   # Edite o arquivo .env
   OPENAI_API_KEY=sk-sua-chave-aqui
   PORT=3000
   NODE_ENV=development
   ```

5. **Inicie o servidor**
   ```bash
   # Para produção
   npm start

   # Para desenvolvimento (com watch mode)
   npm run dev
   ```

6. **Acesse a aplicação**
   ```
   http://localhost:3000
   ```

## 📝 Uso

1. Digite 3 palavras em português nos campos de entrada
2. Clique em "Gerar Frase"
3. Aguarde o processamento (motivacional e satírico em paralelo)
4. As frases serão exibidas lado a lado para comparação

## 🔌 API Endpoints

### POST /api/phrases

Gera frases (motivacional e satírica) com base nas palavras fornecidas.

**Request:**
```json
{
  "words": ["sucesso", "trabalho", "café"]
}
```

**Response (200):**
```json
{
  "success": true,
  "words": ["sucesso", "trabalho", "café"],
  "motivationalPhrase": "Com trabalho e café, o sucesso é inevitável.",
  "satiricalPhrase": "Sucesso é o que acontece enquanto você toma café e finge que o trabalho não existe.",
  "timestamp": "2024-05-20T10:00:00.000Z"
}
```

### GET /api/history

Recupera o histórico das últimas frases geradas.

**Query Params:**
- `limit`: Número de registros (default 20, max 100)

**Response:**
```json
{
  "success": true,
  "count": 1,
  "entries": [
    {
      "words": ["sucesso", "trabalho", "café"],
      "motivationalPhrase": "...",
      "satiricalPhrase": "...",
      "timestamp": "..."
    }
  ]
}
```

### GET /health

Verifica o status da aplicação.

## 📁 Estrutura do Projeto

```
gera-motivacional/
├── server.js              # Servidor Express principal
├── satiricalGenerator.js  # Lógica de geração de frases satíricas
├── history.js             # Gerenciamento de histórico (JSON)
├── public/                # Frontend (HTML, CSS, JS)
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── test/                  # Testes automatizados
├── data/                  # Armazenamento de dados (histórico)
├── package.json           # Dependências e scripts
└── .env                   # Configurações
```

## 🛠️ Tecnologias Utilizadas

### Backend
- **Express.js** - Framework web
- **OpenAI SDK** - Integração com ChatGPT
- **Helmet** - Segurança de headers HTTP
- **Express Rate Limit** - Proteção contra abuso
- **Express Validator** - Validação de dados de entrada
- **Sanitize HTML** - Limpeza de conteúdo gerado pela IA
- **Dotenv** - Variáveis de ambiente

### Frontend
- **Tailwind CSS** - Estilização moderna
- **JavaScript Vanilla** - Lógica e chamadas de API
- **Fetch API** - Comunicação assíncrona

## 🧪 Testes

O projeto utiliza o test runner nativo do Node.js.

```bash
# Rodar todos os testes
npm test

# Rodar com cobertura
npm run test:coverage
```

## 🐛 Troubleshooting

### Erro: "Chave de API OpenAI inválida"
- Verifique se a chave está correta no arquivo `.env`
- Acesse https://platform.openai.com/api-keys para gerar uma nova chave

### Erro: "Limite de requisições atingido"
- Aguarde alguns minutos antes de fazer novas requisições
- Verifique seu plano de uso da API OpenAI

### Erro: "Frase não contém todas as palavras"
- Tente novamente, pois a API pode gerar frases diferentes
- Use palavras mais comuns em português

### Servidor não inicia
- Verifique se a porta 3000 está disponível
- Tente usar uma porta diferente alterando `PORT` no `.env`

## 📦 Deploy

### Opção 1: Railway / Render / Heroku
A aplicação está pronta para ser enviada para qualquer provedor que suporte Node.js. Certifique-se de configurar a variável de ambiente `OPENAI_API_KEY` no painel do provedor.

## 📄 Licença

MIT

## 👤 Autor

Marcelo Martins - [@ospm1970](https://github.com/ospm1970)

---
**Desenvolvido com ❤️ usando Node.js e OpenAI**
