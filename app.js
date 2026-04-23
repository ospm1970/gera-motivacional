// Elementos do DOM
const form = document.getElementById('motivationalForm');
const word1Input = document.getElementById('word1');
const word2Input = document.getElementById('word2');
const word3Input = document.getElementById('word3');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const resultContainer = document.getElementById('resultContainer');
const loadingContainer = document.getElementById('loadingContainer');
const phraseDisplay = document.getElementById('phraseDisplay');
const wordsDisplay = document.getElementById('wordsDisplay');
const timestamp = document.getElementById('timestamp');
const submitText = document.getElementById('submitText');
const spinner = document.getElementById('spinner');

// Validar entrada
function validateInput(word) {
  if (!word || word.trim().length === 0) {
    return false;
  }
  const portugueseWordRegex = /^[a-záàâãéèêíïóôõöúçñ\s-]+$/i;
  return portugueseWordRegex.test(word.trim());
}

// Mostrar erro
function showError(message) {
  errorText.textContent = message;
  errorMessage.classList.remove('hidden');
  resultContainer.classList.add('hidden');
  loadingContainer.classList.add('hidden');
}

// Limpar erro
function clearError() {
  errorMessage.classList.add('hidden');
  errorText.textContent = '';
}

// Submeter formulário
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  const word1 = word1Input.value.trim();
  const word2 = word2Input.value.trim();
  const word3 = word3Input.value.trim();

  // Validar palavras
  if (!validateInput(word1)) {
    showError('Palavra 1 é inválida. Use apenas letras portuguesas.');
    return;
  }
  if (!validateInput(word2)) {
    showError('Palavra 2 é inválida. Use apenas letras portuguesas.');
    return;
  }
  if (!validateInput(word3)) {
    showError('Palavra 3 é inválida. Use apenas letras portuguesas.');
    return;
  }

  // Mostrar loading
  resultContainer.classList.add('hidden');
  loadingContainer.classList.remove('hidden');
  submitBtn.disabled = true;
  resetBtn.disabled = true;
  submitText.classList.add('hidden');
  spinner.classList.remove('hidden');

  try {
    // ✅ CORRIGIDO: Usar o endpoint correto
    const response = await fetch('/api/phrases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        words: [word1, word2, word3],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.error || 'Erro ao gerar frase motivacional');
      loadingContainer.classList.add('hidden');
      return;
    }

    // ✅ CORRIGIDO: Usar os campos corretos da resposta
    phraseDisplay.textContent = data.motivationalPhrase;
    document.getElementById('satiricalDisplay').textContent = data.satiricalPhrase;
    
    wordsDisplay.innerHTML = data.words
      .map(
        word =>
          `<span class="bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">${word}</span>`
      )
      .join('');

    const date = new Date(data.timestamp);
    timestamp.textContent = `Gerado em ${date.toLocaleString('pt-BR')}`;

    resultContainer.classList.remove('hidden');
    loadingContainer.classList.add('hidden');
    
    // Scroll para o resultado
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (error) {
    console.error('Erro:', error);
    showError('Erro de conexão. Verifique sua internet e tente novamente.');
    loadingContainer.classList.add('hidden');
  } finally {
    submitBtn.disabled = false;
    resetBtn.disabled = false;
    submitText.classList.remove('hidden');
    spinner.classList.add('hidden');
  }
});

// Limpar formulário
resetBtn.addEventListener('click', () => {
  form.reset();
  resultContainer.classList.add('hidden');
  loadingContainer.classList.add('hidden');
  clearError();
  word1Input.focus();
});

// Focus inicial
word1Input.focus();
