import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './MotivationalSatirical.css';

// Reusable Phrase component
function Phrase({ title, text, className }) {
  return (
    <div className={`phrase-container ${className}`} role="region" aria-label={title}>
      <h2 className="phrase-title">{title}</h2>
      <p className="phrase-text">{text}</p>
    </div>
  );
}

Phrase.propTypes = {
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  className: PropTypes.string
};

Phrase.defaultProps = {
  className: ''
};

// Main component that fetches and displays both phrases side by side
export default function MotivationalSatirical({ words = ['Foco', 'Determinação', 'Sucesso'] }) {
  const [motivational, setMotivational] = useState('');
  const [satirical, setSatirical] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchPhrases() {
      try {
        setLoading(true);
        setError(null);
        
        // Faz UMA ÚNICA chamada para o backend (mais eficiente)
        const response = await fetch('/api/phrases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ words }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Erro ao gerar frases');
        }

        const data = await response.json();

        if (isMounted) {
          setMotivational(data.motivationalPhrase || '');
          setSatirical(data.satiricalPhrase || '');
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Erro ao carregar as frases.');
          setLoading(false);
        }
      }
    }
    
    fetchPhrases();
    
    return () => {
      isMounted = false;
    };
  }, [words]); // Re-fetch se as palavras mudarem

  if (loading) {
    return <div className="loading" aria-live="polite">Carregando frases... (Pode levar alguns segundos)</div>;
  }

  if (error) {
    return <div className="error" role="alert">{error}</div>;
  }

  return (
    <main className="phrases-wrapper" aria-label="Frases motivacional e satírica">
      <Phrase title="Frase Motivacional" text={motivational} className="motivational" />
      <Phrase title="Frase Satírica" text={satirical} className="satirical" />
    </main>
  );
}
