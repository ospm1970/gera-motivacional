const phrasesContainer = document.getElementById('phrases-container');

async function fetchPhrases() {
  try {
    const res = await fetch('/api/phrases');
    if (!res.ok) throw new Error('Erro ao buscar frases');
    const data = await res.json();
    renderPhrases(data);
  } catch (error) {
    console.error(error);
    phrasesContainer.innerHTML = '<p>Erro ao carregar frases.</p>';
  }
}

function renderPhrases(phrases) {
  phrasesContainer.innerHTML = '';
  phrases.forEach(({ phrase, averageRating, ratingCount }) => {
    const phraseDiv = document.createElement('div');
    phraseDiv.className = 'phrase-item';

    const textP = document.createElement('p');
    textP.textContent = phrase;
    phraseDiv.appendChild(textP);

    const ratingInfo = document.createElement('p');
    ratingInfo.textContent = `Média: ${averageRating !== null ? averageRating : '-'} | Avaliações: ${ratingCount}`;
    phraseDiv.appendChild(ratingInfo);

    const form = document.createElement('form');
    form.className = 'rating-form';

    const label = document.createElement('label');
    label.textContent = 'Sua nota (1-5): ';
    label.setAttribute('for', `rating-input-${phrase}`);
    form.appendChild(label);

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.max = '5';
    input.required = true;
    input.id = `rating-input-${phrase}`;
    input.name = 'rating';
    form.appendChild(input);

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Enviar';
    form.appendChild(submitBtn);

    const messageSpan = document.createElement('span');
    messageSpan.className = 'form-message';
    form.appendChild(messageSpan);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      messageSpan.textContent = '';
      const ratingValue = parseInt(input.value, 10);
      if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        messageSpan.textContent = 'Nota inválida. Informe um número entre 1 e 5.';
        return;
      }

      try {
        const response = await fetch('/api/phrases/ratings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phrase, rating: ratingValue })
        });
        if (response.status === 201) {
          messageSpan.textContent = 'Avaliação enviada com sucesso!';
          input.value = '';
          await fetchPhrases(); // Atualiza médias
        } else {
          const errorData = await response.json();
          messageSpan.textContent = errorData.error || (errorData.errors ? errorData.errors.map(e => e.msg).join(', ') : 'Erro ao enviar avaliação');
        }
      } catch (error) {
        messageSpan.textContent = 'Erro na comunicação com o servidor.';
      }
    });

    phraseDiv.appendChild(form);
    phrasesContainer.appendChild(phraseDiv);
  });
}

// Inicializa
fetchPhrases();
