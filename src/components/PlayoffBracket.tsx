/**
 * Componente per il tabellone playoff completo
 */

import React from 'react';
import type { KnockoutMatch } from '../types';
import { MatchCard } from './MatchCard';
import { WarningMessage } from './Messages';

interface BracketProps {
  matches: KnockoutMatch[];
}

export const PlayoffBracket: React.FC<BracketProps> = ({ matches }) => {
  const qfMatches = matches.filter((m) => m.round === 'QF');
  const sfMatches = matches.filter((m) => m.round === 'SF');
  const finalMatches = matches.filter((m) => m.round === 'F' || m.round === '3P');
  const hasConflicts = qfMatches.some((m) => m.conflict);

  return (
    <div className="bracket-section">
      <h3>🏆 Tabellone Playoff</h3>

      {/* Quarti di Finale */}
      <div className="round-section">
        <h4 className="round-title">Quarti di Finale</h4>
        <p className="round-date">📅 Sabato 7 o Domenica 8 Marzo 2026</p>

        <div className="matches-grid">
          {qfMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>

        {hasConflicts && (
          <WarningMessage>
            Sono presenti accoppiamenti con squadre dello stesso girone.
            Secondo il regolamento, questi dovrebbero essere evitati ai quarti di finale.
          </WarningMessage>
        )}
      </div>

      {/* Semifinali */}
      <div className="round-section">
        <h4 className="round-title">Semifinali</h4>
        <p className="round-date">📅 Sabato 14 o Domenica 15 Marzo 2026</p>

        <div className="matches-grid">
          <MatchCard
            match={{
              ...sfMatches[0],
              label: 'Semifinale 1',
            }}
          />
          <MatchCard
            match={{
              ...sfMatches[1],
              label: 'Semifinale 2',
            }}
          />
        </div>

        <p className="info-text" style={{ marginTop: '1rem', textAlign: 'center' }}>
          SF1: Vincente QF1 vs Vincente QF4 • SF2: Vincente QF2 vs Vincente QF3
        </p>
      </div>

      {/* Finali */}
      <div className="round-section finals">
        <h4 className="round-title">Finali</h4>

        <div className="matches-grid">
          <MatchCard
            match={finalMatches.find((m) => m.round === 'F')!}
            className="final"
          />
          <MatchCard
            match={finalMatches.find((m) => m.round === '3P')!}
            className="bronze"
          />
        </div>
      </div>
    </div>
  );
};
