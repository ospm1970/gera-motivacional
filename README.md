# ✨ Gerador de Frases Motivacionais

Aplicação web que solicita 3 palavras do usuário e gera uma frase motivacional em português usando a API do ChatGPT.

## 🎯 Funcionalidades

- ✅ Interface intuitiva e responsiva
- ✅ Solicita 3 palavras em português
- ✅ Gera frases motivacionais personalizadas usando ChatGPT
- ✅ Validação de entrada em tempo real
- ✅ Tratamento de erros robusto
- ✅ Design moderno com Tailwind CSS
- ✅ API REST bem estruturada

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
   npm start
   ```

6. **Acesse a aplicação**
   ```
   http://localhost:3000
   ```

## 📝 Uso

1. Digite 3 palavras em português nos campos de entrada
2. Clique em "Gerar Frase"
3. Aguarde a geração da frase motivacional
4. A frase será exibida com as palavras utilizadas

## 🔌 API Endpoints

### POST /api/motivational-phrase

Gera uma frase motivacional com base nas palavras fornecidas.

**Request:**
```json
{
  "words": ["sucesso", "determinação", "crescimento"]
}
```

**Response (200):**
```json
{
  "success": true,
  "words": ["sucesso", "determinação", "crescimento"],
  "phrase": "Com sucesso, determinação e crescimento, você alcançará seus objetivos.",
  "timestamp": "2026-04-07T22:00:00.000Z"
}
```

**Response (400):**
```json
{
  "error": "Deve fornecer exatamente 3 palavras"
}
```

**Response (500):**
```json
{
  "error": "Erro ao gerar frase motivacional. Tente novamente mais tarde."
}
```

### GET /health

Verifica o status da aplicação.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-07T22:00:00.000Z"
}
```

## 📁 Estrutura do Projeto

```
gera-motivacional/
├── server.js              # Servidor Express e API
├── public/
│   └── index.html         # Interface frontend
├── package.json           # Dependências do projeto
├── .env                   # Variáveis de ambiente
├── .env.example           # Exemplo de variáveis
└── README.md              # Este arquivo
```

## 🛠️ Tecnologias Utilizadas

### Backend
- **Express.js** - Framework web
- **OpenAI API** - Geração de frases com ChatGPT
- **CORS** - Compartilhamento de recursos entre origens
- **dotenv** - Gerenciamento de variáveis de ambiente

### Frontend
- **HTML5** - Estrutura
- **Tailwind CSS** - Estilização
- **JavaScript Vanilla** - Interatividade
- **Fetch API** - Requisições HTTP

## 🧪 Validação

### Validação de Entrada
- Exatamente 3 palavras obrigatórias
- Apenas letras portuguesas (incluindo acentos)
- Sem números ou caracteres especiais
- Sem campos vazios

### Validação de Saída
- Verifica se a frase contém todas as 3 palavras
- Retorna erro se alguma palavra estiver faltando
- Trata erros da API do OpenAI

## 🔐 Segurança

- Validação de entrada no frontend e backend
- Proteção contra SQL injection (não usa banco de dados)
- Tratamento seguro de erros
- Variáveis de ambiente para dados sensíveis
- CORS configurado para requisições seguras

## 📊 Exemplos de Uso

### Exemplo 1
```
Palavras: "inovação", "criatividade", "futuro"
Frase: "A inovação e criatividade são as chaves para construir um futuro melhor."
```

### Exemplo 2
```
Palavras: "coragem", "ação", "resultado"
Frase: "Com coragem para agir, você alcançará resultados extraordinários."
```

### Exemplo 3
```
Palavras: "persistência", "força", "vitória"
Frase: "A persistência e a força levam à vitória."
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
- Tente usar uma porta diferente: `PORT=3001 npm start`

## 📦 Deploy

### Opção 1: Heroku
```bash
heroku create seu-app
git push heroku main
heroku config:set OPENAI_API_KEY=sua-chave
```

### Opção 2: Railway
```bash
railway link
railway up
```

### Opção 3: Vercel
```bash
vercel
```

## 📄 Licença

MIT - Veja o arquivo LICENSE para detalhes

## 👤 Autor

Marcelo Martins - [@ospm1970](https://github.com/ospm1970)

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## 📞 Suporte

Para suporte, abra uma issue no repositório ou entre em contato através do GitHub.

---

**Desenvolvido com ❤️ usando Node.js e OpenAI**
