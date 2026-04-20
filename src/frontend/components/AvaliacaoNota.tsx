import React, { useState } from 'react';
import axios from 'axios';

interface AvaliacaoNotaProps {
  phraseId: string;
  onSuccess?: () => void;
}

const AvaliacaoNota: React.FC<AvaliacaoNotaProps> = ({ phraseId, onSuccess }) => {
  const [nota, setNota] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (nota === null || nota < 0 || nota > 5) {
      setError('Por favor, selecione uma nota entre 0 e 5');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Você precisa estar autenticado para enviar avaliação');
        setLoading(false);
        return;
      }
      await axios.post('/api/avaliacoes', { phraseId, nota }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Avaliação enviada com sucesso');
      setNota(null);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Erro ao enviar avaliação');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div aria-live="polite" role="region" className="avaliacao-nota">
      <label htmlFor="nota" className="block font-semibold mb-1">Avalie esta frase (0 a 5):</label>
      <input
        id="nota"
        type="number"
        step="0.1"
        min="0"
        max="5"
        value={nota !== null ? nota : ''}
        onChange={e => setNota(parseFloat(e.target.value))}
        aria-describedby="notaHelp"
        disabled={loading}
        className="border rounded px-2 py-1 w-20"
      />
      <button
        onClick={handleSubmit}
        disabled={loading || nota === null}
        className="ml-2 bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
      >
        {loading ? 'Enviando...' : 'Enviar'}
      </button>
      <p id="notaHelp" className="sr-only">Nota decimal entre zero e cinco</p>
      {error && <p role="alert" className="text-red-600 mt-2">{error}</p>}
      {success && <p role="status" className="text-green-600 mt-2">{success}</p>}
    </div>
  );
};

export default AvaliacaoNota;
