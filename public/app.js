import { showError, clearError } from '../app.js';

async function fetchAverageRating() {
  const averageRatingEl = document.getElementById('average-rating');
  try {
    const response = await fetch('/api/phrases/ratings/average');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.average === null) {
      averageRatingEl.textContent = 'Nenhuma avaliação disponível';
    } else {
      averageRatingEl.textContent = `Média das avaliações: ${data.average.toFixed(2)}`;
    }
    clearError();
  } catch (error) {
    averageRatingEl.textContent = 'Erro ao carregar a média das avaliações';
    showError('Não foi possível carregar a média das avaliações. Tente novamente mais tarde.');
    console.error('Erro ao buscar média das avaliações:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchAverageRating();
});
