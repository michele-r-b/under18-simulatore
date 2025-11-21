/**
 * Card per visualizzare un singolo match
 */

import React from 'react';
import type { KnockoutMatch } from '../types';

interface MatchCardProps {
  match: KnockoutMatch;
  className?: string;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, className = '' }) => {
  const cardClass = `match-card ${className} ${match.conflict ? 'conflict' : ''}`.trim();

  return (
    <div className={cardClass}>
      <div className="match-header">
        {match.label}
        {match.conflict && (
          <span className="warning-badge">⚠️ Stesso Girone</span>
        )}
      </div>

      {match.date && (
        <p className="round-date">📅 {match.date}</p>
      )}

      <div className="match-teams">
        {match.home && match.away ? (
          <>
            <div className="team-line">
              <span className="seed">{match.home.caPosition}°</span>
              <span className="team">{match.home.name}</span>
              <span className={`girone-badge girone-${match.home.girone}`}>
                {match.home.girone}
              </span>
            </div>
            <div className="vs">vs</div>
            <div className="team-line">
              <span className="seed">{match.away.caPosition}°</span>
              <span className="team">{match.away.name}</span>
              <span className={`girone-badge girone-${match.away.girone}`}>
                {match.away.girone}
              </span>
            </div>
          </>
        ) : (
          <div className="team-line placeholder">
            {match.round === 'SF' && 'Vincenti Quarti di Finale'}
            {match.round === 'F' && 'Vincenti Semifinali'}
            {match.round === '3P' && 'Perdenti Semifinali'}
          </div>
        )}
      </div>

      {match.round === '3P' && (
        <p className="match-note">
          ℹ️ In casa della squadra meglio classificata nella C.A.
        </p>
      )}
    </div>
  );
};
