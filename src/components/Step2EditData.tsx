/**
 * Step 2: Modifica dati e simulazione scenari
 */

import React from 'react';
import type { TeamStats, Girone } from '../types';
import { GironeTable } from './GironeTable';

interface Step2Props {
  teams: TeamStats[];
  teamsByGirone: Record<Girone, TeamStats[]>;
  onUpdateField: (teamId: string, field: keyof TeamStats, value: number) => void;
  onAddMatch: (homeTeamId: string, awayTeamId: string, result: '3-0' | '3-1' | '3-2' | '0-3' | '1-3' | '2-3') => void;
  onResetGirone: (girone: Girone) => void;  // ← AGGIUNTO
  onComputeAvulsa: () => void;
  isActive: boolean;
}

export const Step2EditData: React.FC<Step2Props> = ({
  teams,
  teamsByGirone,
  onUpdateField,
  onAddMatch,
  onResetGirone,
  onComputeAvulsa,
  isActive,
}) => {
  if (teams.length === 0) return null;

  const gironi: Girone[] = ['A', 'B', 'C', 'D'];

  return (
    <section className={`card step-section ${isActive ? 'active' : ''}`}>
      <div className="step-header">
        <span className="step-number">2</span>
        <h2>Modifica Dati e Simulazione Scenari</h2>
      </div>

      <div className="step-content">
        <p className="info-text">
          Modifica i valori per simulare diversi scenari di fine campionato.
          I quozienti (QuozienteSet, QuozientePunti, QuozienteGare) vengono ricalcolati automaticamente.
        </p>

       {gironi.map((girone) => (
          <GironeTable
            key={girone}
            girone={girone}
            teams={teamsByGirone[girone]}
            onUpdateField={onUpdateField}
            onAddMatch={onAddMatch}
            onResetGirone={onResetGirone}
          />
        ))}

        <button onClick={onComputeAvulsa} className="primary-button">
          🔄 Calcola Classifica Avulsa e Tabellone
        </button>
      </div>
    </section>
  );
};
