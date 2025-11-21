/**
 * Step 3: Visualizzazione risultati (Classifica Avulsa + Tabellone)
 */

import React from 'react';
import type { TeamStats, KnockoutMatch } from '../types';
import { AvulsaTable } from './AvulsaTable';
import { PlayoffBracket } from './PlayoffBracket';

interface Step3Props {
  avulsa: TeamStats[];
  matches: KnockoutMatch[];
  isActive: boolean;
}

export const Step3Results: React.FC<Step3Props> = ({ avulsa, matches, isActive }) => {
  if (avulsa.length === 0) return null;

  return (
    <section className={`card step-section ${isActive ? 'active' : ''}`}>
      <div className="step-header">
        <span className="step-number">3</span>
        <h2>Classifica Avulsa e Tabellone Playoff</h2>
      </div>

      <div className="step-content">
        {/* Classifica Avulsa */}
        <AvulsaTable teams={avulsa} />

        {/* Tabellone Playoff */}
        {matches.length > 0 && <PlayoffBracket matches={matches} />}
      </div>
    </section>
  );
};
