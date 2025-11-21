/**
 * Tabella per visualizzare e modificare i dati di un girone
 */

import React from 'react';
import type { TeamStats, Girone } from '../types';
import { GIRONE_NAMES } from '../constants';

interface GironeTableProps {
  girone: Girone;
  teams: TeamStats[];
  onUpdateField: (teamId: string, field: keyof TeamStats, value: number) => void;
}

const TABLE_FIELDS: Array<{
  key: keyof TeamStats;
  label: string;
  editable: boolean;
  format?: (value: number) => string;
}> = [
  { key: 'GareGiocate', label: 'Gare', editable: true },
  { key: 'PuntiCampionato', label: 'Punti', editable: true },
  { key: 'GareVinte', label: 'Vinte', editable: true },
  { key: 'GarePerse', label: 'Perse', editable: true },
  { key: 'SetVinti', label: 'Set Vinti', editable: true },
  { key: 'SetPersi', label: 'Set Persi', editable: true },
  { key: 'PuntiFatti', label: 'Punti Fatti', editable: true },
  { key: 'PuntiSubiti', label: 'Punti Subiti', editable: true },
  { key: 'QuozienteGare', label: 'Quoziente Gare', editable: false, format: (v) => v.toFixed(3) },
  { key: 'QuozienteSet', label: 'Quoziente Set', editable: false, format: (v) => v.toFixed(3) },
  { key: 'QuozientePunti', label: 'Quoziente Punti', editable: false, format: (v) => v.toFixed(3) },
];

/**
 * Tronca il nome della squadra se troppo lungo
 */
function truncateName(name: string, maxLength: number = 25): string {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength) + '...';
}

export const GironeTable: React.FC<GironeTableProps> = ({ girone, teams, onUpdateField }) => {
  return (
    <div className="girone-section">
      <h3 className="girone-title">{GIRONE_NAMES[girone]}</h3>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="sticky-col">#</th>
              <th className="sticky-col">Squadra</th>
              {TABLE_FIELDS.map((field) => (
                <th key={field.key}>{field.label.split(' ').map((word, i) => (
                  <React.Fragment key={i}>
                    {word}
                    {i < field.label.split(' ').length - 1 && <br />}
                  </React.Fragment>
                ))}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((team, idx) => (
              <tr key={team.id} className={idx < 2 ? 'qualified-row' : ''}>
                <td className="sticky-col pos-col">{idx + 1}</td>
                <td className="sticky-col team-name" title={team.name}>
                  {truncateName(team.name)}
                </td>
                {TABLE_FIELDS.map((field) => (
                  <td key={field.key}>
                    <input
                      type="number"
                      value={
                        field.format
                          ? field.format(team[field.key] as number)
                          : team[field.key]
                      }
                      className="data-input"
                      step="1"
                      onChange={(e) =>
                        onUpdateField(team.id, field.key, Number(e.target.value))
                      }
                      disabled={!field.editable}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <p className="legend">
        <span className="qualified-indicator"></span> Prime 2 posizioni = qualificate
      </p>
    </div>
  );
};
