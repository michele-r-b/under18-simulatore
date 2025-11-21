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
  onAddMatch: (girone: string, homeTeamId: string, awayTeamId: string, result: '3-0' | '3-1' | '3-2' | '0-3' | '1-3' | '2-3') => void;
  onResetGirone: (girone: Girone) => void;  // ← AGGIUNTO
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

export const GironeTable: React.FC<GironeTableProps> = ({ girone, teams, onUpdateField, onAddMatch, onResetGirone }) => {
  const [showMatchForm, setShowMatchForm] = React.useState(false);
  const [homeTeamId, setHomeTeamId] = React.useState('');
  const [awayTeamId, setAwayTeamId] = React.useState('');
  const [result, setResult] = React.useState<'3-0' | '3-1' | '3-2' | '0-3' | '1-3' | '2-3'>('3-0');
  const [log, setLog] = React.useState<string[]>([]);

const addLogEntry = (message: string) => {
    setLog((prev) => [message, ...prev]);
  };

const handleUpdateField = (teamId: string, field: keyof TeamStats, value: number) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;
    
    const fieldLabels: Record<string, string> = {
      'GareGiocate': 'Gare',
      'PuntiCampionato': 'Punti',
      'GareVinte': 'Vinte',
      'GarePerse': 'Perse',
      'SetVinti': 'Set Vinti',
      'SetPersi': 'Set Persi',
      'PuntiFatti': 'Punti Fatti',
      'PuntiSubiti': 'Punti Subiti'
    };
    
    const oldValue = team[field];
    if (oldValue !== value) {
      const fieldName = fieldLabels[field] || field;
      addLogEntry(`${truncateName(team.name, 20)}: ${fieldName} ${oldValue} → ${value}`);
    }
    
    onUpdateField(teamId, field, value);
  };
  
const handleReset = () => {
    if (window.confirm(`Vuoi davvero ripristinare i valori originali del Girone ${girone}? Tutte le modifiche saranno perse.`)) {
      onResetGirone(girone);
      setLog([]);
      addLogEntry('🔄 Girone ripristinato ai valori originali');
    }
  };

 const handleAddMatch = () => {
    if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) {
      alert('Seleziona due squadre diverse!');
      return;
    }
    
    const homeName = teams.find((t) => t.id === homeTeamId)?.name || 'Squadra';
    const awayName = teams.find((t) => t.id === awayTeamId)?.name || 'Squadra';
    
    onAddMatch(girone, homeTeamId, awayTeamId, result);
    addLogEntry(`Partita aggiunta: ${homeName} vs ${awayName} → Risultato: ${result}`);
    
    // Reset form
    setHomeTeamId('');
    setAwayTeamId('');
    setResult('3-0');
    setShowMatchForm(false);
  };

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
                        handleUpdateField(team.id, field.key, Number(e.target.value))
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
      
      <div className="legend-row">
        <p className="legend">
          <span className="qualified-indicator"></span> Prime 2 posizioni = qualificate
        </p>
        {!showMatchForm && (
          <button
            onClick={() => setShowMatchForm(true)}
            className="secondary-button add-match-btn"
          >
            ➕ Aggiungi Partita
          </button>
        )}
      </div>

    {/* Form Aggiungi Partita */}
      {showMatchForm && (
        <div className="add-match-section">
          <div className="match-form">
            <h4>➕ Aggiungi Partita - {girone}</h4>
            
            <div className="form-row">
              <div className="form-field">
                <label>Squadra Casa:</label>
                <select
                  value={homeTeamId}
                  onChange={(e) => setHomeTeamId(e.target.value)}
                  className="form-select"
                >
                  <option value="">Seleziona...</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Squadra Trasferta:</label>
                <select
                  value={awayTeamId}
                  onChange={(e) => setAwayTeamId(e.target.value)}
                  className="form-select"
                >
                  <option value="">Seleziona...</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id} disabled={team.id === homeTeamId}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Risultato (Casa - Trasferta):</label>
                <select
                  value={result}
                  onChange={(e) => setResult(e.target.value as '3-0' | '3-1' | '3-2' | '0-3' | '1-3' | '2-3')}
                  className="form-select"
                >
                  <optgroup label="Vittoria Casa">
                    <option value="3-0">3-0 (Casa: 3 punti, Trasferta: 0 punti)</option>
                    <option value="3-1">3-1 (Casa: 3 punti, Trasferta: 0 punt1)</option>
                    <option value="3-2">3-2 (Casa: 2 punti, Trasferta: 1 punto) [5° set: 15-10]</option>
                  </optgroup>
                  <optgroup label="Vittoria Trasferta">
                    <option value="0-3">0-3 (Casa: 0 punti, Trasferta: 3 punti)</option>
                    <option value="1-3">1-3 (Casa: 0 punt1, Trasferta: 3 punti)</option>
                    <option value="2-3">2-3 (Casa: 1 punto, Trasferta: 2 punti) [5° set: 15-10]</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button onClick={handleAddMatch} className="primary-button">
                ✅ Conferma Partita
              </button>
              <button
                onClick={() => {
                  setShowMatchForm(false);
                  setHomeTeamId('');
                  setAwayTeamId('');
                  setResult('3-0');
                }}
                className="secondary-button"
              >
                ❌ Annulla
              </button>
            </div>

            <p className="form-note">
              ℹ️ Set predefiniti: 25-15 punti | 5° set tie-break: 15-10 punti
  </p>
          </div>
        </div>
      )}

      {/* Log Modifiche */}
      {log.length > 0 && (
        <div className="log-section">
          <div className="log-header">
            <h4 className="log-title">📋 Registro Modifiche</h4>
            <button
              onClick={handleReset}
              className="secondary-button clear-log-btn"
            >
              🔄 Ripristina Girone
            </button>
          </div>
          <div className="log-container">
            {log.map((message, idx) => (
              <div key={idx} className="log-entry">
                {message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
