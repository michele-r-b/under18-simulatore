/**
 * Step 1: Caricamento dati dalle API
 */

import React from 'react';
import { ErrorMessage, SuccessMessage, InfoBox } from './Messages';

interface Step1Props {
  loading: boolean;
  error: string | null;
  teamsCount: number;
  gironiCount: number;
  onLoadData: () => void;
  isActive: boolean;
}

export const Step1LoadData: React.FC<Step1Props> = ({
  loading,
  error,
  teamsCount,
  gironiCount,
  onLoadData,
  isActive,
}) => {
  return (
    <section className={`card step-section ${isActive ? 'active' : ''}`}>
      <div className="step-header">
        <span className="step-number">1</span>
        <h2>Recupero Dati dalle Classifiche</h2>
      </div>

      <div className="step-content">
        <p className="info-text">
          Carica i dati attuali delle classifiche dei 4 gironi (A, B, C, D) Under 18 Femminile
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={onLoadData}
            disabled={loading}
            className="primary-button"
          >
            {loading ? '⏳ Caricamento in corso...' : '📥 Carica Partite'}
          </button>
        </div>

        {error && (
          <ErrorMessage>
            <pre style={{
              whiteSpace: 'pre-wrap',
              marginTop: '0.5rem',
              fontSize: '0.9rem',
              lineHeight: '1.4'
            }}>
              {error}
            </pre>
            <p style={{ marginTop: '1rem', fontSize: '0.95rem' }}>
              💡 <strong>Suggerimento:</strong> Se l'API non è raggiungibile, usa i "Dati di Esempio"
              per testare tutte le funzionalità dell'applicazione.
            </p>
          </ErrorMessage>
        )}

        {teamsCount > 0 && (
          <SuccessMessage>
            ✅ Caricate {teamsCount} squadre da {gironiCount} gironi
          </SuccessMessage>
        )}

        <InfoBox>
          <h4 style={{ marginBottom: '0.5rem' }}>ℹ️ Informazioni sul caricamento</h4>
          <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
            <li><strong>Dati:</strong> Tenterà il recupero dati, ogni richiesta sovrascrive i dati</li>
            <li><strong>Simulazione:</strong> Dopo si possono fare simulazioni</li>
          </ul>
        </InfoBox>
      </div>
    </section>
  );
};
