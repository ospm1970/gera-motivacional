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
const satiricalDisplay = document.getElementById('satiricalDisplay');
const wordsDisplay = document.getElementById('wordsDisplay');
const timestamp = document.getElementById('timestamp');
const submitText = document.getElementById('submitText');
const spinner = document.getElementById('spinner');

function validateInput(word) {
  if (!word || word.trim().length === 0) return false;
  return /^[a-záàâãéèêíïóôõöúçñ\s-]+$/i.test(word.trim());
}

function showError(message) {
  errorText.textContent = message;
  errorMessage.classList.remove('hidden');
  resultContainer.classList.add('hidden');
  loadingContainer.classList.add('hidden');
}

function clearError() {
  errorMessage.classList.add('hidden');
  errorText.textContent = '';
}

function buildStars(containerId, phraseGetter, phraseType, msgId) {
  if (typeof document.createElement !== 'function') return;
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('button');
    star.type = 'button';
    star.textContent = '★';
    star.className = 'star-btn';
    star.dataset.value = i;
    star.setAttribute('aria-label', `${i} estrela${i > 1 ? 's' : ''}`);

    star.addEventListener('mouseover', () => highlightStars(container, i));
    star.addEventListener('mouseout', () => resetStars(container));
    star.addEventListener('click', () => submitRating(phraseGetter(), phraseType, i, container, msgId));

    container.appendChild(star);
  }
}

function highlightStars(container, value) {
  container.querySelectorAll('.star-btn').forEach(s => {
    s.classList.toggle('hovered', parseInt(s.dataset.value) <= value);
  });
}

function resetStars(container) {
  const selected = parseInt(container.dataset.selected || '0');
  container.querySelectorAll('.star-btn').forEach(s => {
    s.classList.remove('hovered');
    s.classList.toggle('selected', parseInt(s.dataset.value) <= selected);
  });
}

async function submitRating(phrase, phraseType, rating, container, msgId) {
  const msgEl = document.getElementById(msgId);

  container.dataset.selected = rating;
  resetStars(container);
  container.querySelectorAll('.star-btn').forEach(s => s.disabled = true);

  try {
    const res = await fetch('/api/phrases/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phrase, phraseType, rating }),
    });

    if (res.status === 201) {
      msgEl.textContent = '✓ Avaliação enviada!';
      msgEl.style.color = 'green';
    } else {
      const data = await res.json();
      msgEl.textContent = data.error || 'Erro ao enviar.';
      msgEl.style.color = 'red';
      container.querySelectorAll('.star-btn').forEach(s => s.disabled = false);
    }
  } catch {
    msgEl.textContent = 'Erro de conexão.';
    msgEl.style.color = 'red';
    container.querySelectorAll('.star-btn').forEach(s => s.disabled = false);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  const word1 = word1Input.value.trim();
  const word2 = word2Input.value.trim();
  const word3 = word3Input.value.trim();

  if (!validateInput(word1)) { showError('Palavra 1 é inválida. Use apenas letras portuguesas.'); return; }
  if (!validateInput(word2)) { showError('Palavra 2 é inválida. Use apenas letras portuguesas.'); return; }
  if (!validateInput(word3)) { showError('Palavra 3 é inválida. Use apenas letras portuguesas.'); return; }

  resultContainer.classList.add('hidden');
  loadingContainer.classList.remove('hidden');
  submitBtn.disabled = true;
  resetBtn.disabled = true;
  submitText.classList.add('hidden');
  spinner.classList.remove('hidden');

  try {
    const response = await fetch('/api/phrases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words: [word1, word2, word3] }),
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.error || 'Erro ao gerar frase motivacional');
      loadingContainer.classList.add('hidden');
      return;
    }

    phraseDisplay.textContent = data.motivationalPhrase;
    satiricalDisplay.textContent = data.satiricalPhrase;

    wordsDisplay.innerHTML = data.words
      .map(w => `<span class="bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">${w}</span>`)
      .join('');

    timestamp.textContent = `Gerado em ${new Date(data.timestamp).toLocaleString('pt-BR')}`;

    buildStars('starsMotivational', () => data.motivationalPhrase, 'motivational', 'ratingMsgMotivational');
    buildStars('starsSatirical', () => data.satiricalPhrase, 'satirical', 'ratingMsgSatirical');

    resultContainer.classList.remove('hidden');
    loadingContainer.classList.add('hidden');
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

resetBtn.addEventListener('click', () => {
  form.reset();
  resultContainer.classList.add('hidden');
  loadingContainer.classList.add('hidden');
  clearError();
  word1Input.focus();
});

word1Input.focus();
