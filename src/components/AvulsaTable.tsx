/**
 * Componente per visualizzare la classifica avulsa
 */

import React from 'react';
import type { TeamStats } from '../types';

interface AvulsaTableProps {
  teams: TeamStats[];
}

export const AvulsaTable: React.FC<AvulsaTableProps> = ({ teams }) => {
  const conflictIndexes = React.useMemo(() => {
    const idxSet = new Set<number>();
    const pairings: Array<[number, number]> = [
      [0, 7],
      [1, 6],
      [2, 5],
      [3, 4],
    ];

    pairings.forEach(([a, b]) => {
      const first = teams[a];
      const second = teams[b];

      if (first && second && first.girone === second.girone) {
        idxSet.add(a);
        idxSet.add(b);
      }
    });

    return idxSet;
  }, [teams]);

  return (
    <div className="avulsa-section">
      <h3>📊 Classifica Avulsa (1-4 prime di girone, 5-8 seconde)</h3>
      <p className="info-text" style={{ marginTop: '-0.5rem' }}>
        Le prime dei gironi occupano sempre le posizioni 1-4; le seconde le posizioni 5-8.
        Evidenziamo in rosso eventuali accoppiamenti 1-8, 2-7, 3-6 o 4-5 con squadre dello stesso girone.
      </p>
      
      <div className="table-container">
        <table className="avulsa-table">
          <thead>
            <tr>
              <th># C.A.</th>
              <th>Squadra</th>
              <th>Girone</th>
              <th>Punti</th>
              <th>QuozienteSet</th>
              <th>QuozientePunti</th>
              <th>Diff. Punti</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, idx) => (
              <tr
                key={team.id}
                className={conflictIndexes.has(idx) ? 'conflict-row' : undefined}
              >
                <td className="position-cell">{idx + 1}°</td>
                <td className="team-name-cell">{team.name}</td>
                <td>
                  <span className={`girone-badge girone-${team.girone}`}>
                    {team.girone}
                  </span>
                </td>
                <td><strong>{team.PuntiCampionato}</strong></td>
                <td>{team.QuozienteSet.toFixed(3)}</td>
                <td>{team.QuozientePunti.toFixed(3)}</td>
                <td>{team.PuntiFatti - team.PuntiSubiti}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
