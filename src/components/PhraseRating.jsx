import React, { useState } from 'react';

/**
 * Componente para avaliação de frase com nota de 0 a 5.
 * @param {string} phraseId - ID da frase avaliada
 * @param {function} onRatingSubmitted - Callback após submissão
 */
export function PhraseRating({ phraseId, onRatingSubmitted }) {
  const [rating, setRating] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (value >= 0 && value <= 5) {
      setRating(value);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === null) {
      setError('Por favor, selecione uma nota entre 0 e 5');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Usuário não autenticado');
        setSubmitting(false);
        return;
      }

      const response = await fetch('/api/phrases/rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phraseId, rating })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Erro ao enviar avaliação');
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      if (onRatingSubmitted) onRatingSubmitted(rating);
    } catch (err) {
      setError('Erro de rede ao enviar avaliação');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Avaliar frase">
      <fieldset>
        <legend>Avalie a frase (0 a 5):</legend>
        {[0, 1, 2, 3, 4, 5].map((num) => (
          <label key={num} htmlFor={`rating-${num}`}>
            <input
              type="radio"
              id={`rating-${num}`}
              name="rating"
              value={num}
              checked={rating === num}
              onChange={handleChange}
              disabled={submitting}
              aria-checked={rating === num}
            />
            {num}
          </label>
        ))}
      </fieldset>
      <button type="submit" disabled={submitting} aria-disabled={submitting}>
        {submitting ? 'Enviando...' : 'Enviar Avaliação'}
      </button>
      {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
