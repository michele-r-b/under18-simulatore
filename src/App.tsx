import React, { useState } from 'react';
import './App.css';

type Girone = 'A' | 'B' | 'C' | 'D';

interface TeamStats {
  id: string;
  name: string;
  girone: Girone;
  P: number;   // punti
  G: number;   // giocate
  V: number;   // vinte
  Pe: number;  // perse
  SV: number;  // set vinti
  SP: number;  // set persi
  QS: number;  // quoziente set
  PF: number;  // punti fatti
  PS: number;  // punti subiti
  QP: number;  // quoziente punti
  caPosition?: number; // posizione in classifica avulsa
}

interface KnockoutMatch {
  id: string;
  round: 'QF' | 'SF' | 'F' | '3P';
  label: string;
  home: TeamStats | null;
  away: TeamStats | null;
  winnerId?: string;
  conflict?: boolean;
  date?: string;
}

const SID_TO_GIRONE: Record<number, Girone> = {
  315: 'A',
  316: 'B',
  317: 'C',
  318: 'D',
};

const GIRONE_NAMES: Record<Girone, string> = {
  'A': 'Girone A',
  'B': 'Girone B',
  'C': 'Girone C',
  'D': 'Girone D',
};

const SIDS = [315, 316, 317, 318];

// Prova entrambi gli endpoint
const CLASSIFICA_URLS = (sid: number) => [
  `/matchshare/stats_test/rest_api/ranks2?client_name=fipavbergamo&season_id=${sid}`,
  `/matchshare/stats_test/rest_api/fm_classifica?sid=${sid}&client_name=fipavbergamo`
];

type RawTeamFromApi = any;

function mapApiToTeamStats(rawTeam: RawTeamFromApi, girone: Girone): TeamStats {
  // Prova diversi possibili nomi di campo dall'API
  const id = String(
    rawTeam.id_squadra ?? 
    rawTeam.squadra_id ?? 
    rawTeam.team_id ?? 
    rawTeam.id ?? 
    `${girone}-${rawTeam.nome ?? rawTeam.nome_squadra ?? Math.random()}`
  );
  
  const name = String(
    rawTeam.nome_squadra ?? 
    rawTeam.nome ?? 
    rawTeam.team_name ?? 
    rawTeam.squadra ?? 
    'SQUADRA'
  );

  // Calcola QS e QP se non presenti
  const SV = Number(rawTeam.set_vinti ?? rawTeam.SV ?? 0);
  const SP = Number(rawTeam.set_persi ?? rawTeam.SP ?? 0);
  const PF = Number(rawTeam.punti_fatti ?? rawTeam.PF ?? 0);
  const PS = Number(rawTeam.punti_subiti ?? rawTeam.PS ?? 0);
  
  const QS = SP > 0 ? SV / SP : SV;
  const QP = PS > 0 ? PF / PS : PF;

  return {
    id,
    name,
    girone,
    P: Number(rawTeam.punti ?? rawTeam.P ?? 0),
    G: Number(rawTeam.giocate ?? rawTeam.G ?? rawTeam.partite ?? 0),
    V: Number(rawTeam.vinte ?? rawTeam.V ?? rawTeam.vittorie ?? 0),
    Pe: Number(rawTeam.perse ?? rawTeam.Pe ?? rawTeam.sconfitte ?? 0),
    SV,
    SP,
    QS: Number(rawTeam.quoziente_set ?? rawTeam.QS ?? QS),
    PF,
    PS,
    QP: Number(rawTeam.quoziente_punti ?? rawTeam.QP ?? QP),
  };
}

function compareTeams(a: TeamStats, b: TeamStats): number {
  // 1) Punti
  if (b.P !== a.P) return b.P - a.P;
  // 2) Quoziente set
  if (Math.abs(b.QS - a.QS) > 0.001) return b.QS - a.QS;
  // 3) Quoziente punti
  if (Math.abs(b.QP - a.QP) > 0.001) return b.QP - a.QP;
  // 4) differenza punti
  const diffA = a.PF - a.PS;
  const diffB = b.PF - b.PS;
  if (diffB !== diffA) return diffB - diffA;
  // 5) fallback alfabetico
  return a.name.localeCompare(b.name);
}

// Funzione per verificare se due squadre possono incontrarsi ai quarti
function canMeetInQF(team1: TeamStats, team2: TeamStats): boolean {
  return team1.girone !== team2.girone;
}

// Funzione per trovare accoppiamenti validi per i quarti
function findValidQFPairings(rankedTeams: TeamStats[]): KnockoutMatch[] | null {
  if (rankedTeams.length !== 8) return null;

  // Accoppiamento standard: 1-8, 2-7, 3-6, 4-5
  const standardPairings = [
    { home: rankedTeams[0], away: rankedTeams[7], label: 'QF1' },
    { home: rankedTeams[1], away: rankedTeams[6], label: 'QF2' },
    { home: rankedTeams[2], away: rankedTeams[5], label: 'QF3' },
    { home: rankedTeams[3], away: rankedTeams[4], label: 'QF4' },
  ];

  // Verifica conflitti
  return standardPairings.map((p, i) => ({
    id: p.label,
    round: 'QF' as const,
    label: `Quarto di Finale ${i + 1}`,
    home: p.home,
    away: p.away,
    conflict: !canMeetInQF(p.home, p.away),
    date: 'Sabato 7 o Domenica 8 Marzo 2026'
  }));
}

const App: React.FC = () => {
  const [teams, setTeams] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avulsa, setAvulsa] = useState<TeamStats[]>([]);
  const [matches, setMatches] = useState<KnockoutMatch[]>([]);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const handleLoadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const allTeams: TeamStats[] = [];

      for (const sid of SIDS) {
        const urls = CLASSIFICA_URLS(sid);
        let success = false;
        let lastError = '';

        // Prova entrambi gli endpoint
        for (const url of urls) {
          try {
            console.log('Fetching URL:', url);
            const res = await fetch(url);
            const text = await res.text();
            console.log(`Risposta per sid ${sid}:`, text.substring(0, 200));

            if (!res.ok) {
              lastError = `HTTP ${res.status}`;
              continue;
            }

            let json: any;
            try {
              json = JSON.parse(text);
            } catch (parseErr) {
              lastError = 'Risposta non JSON valida';
              continue;
            }

            // Gestisci diverse strutture JSON
            const rawTeams: RawTeamFromApi[] = Array.isArray(json)
              ? json
              : json.data ?? json.result ?? json.classifica ?? [];

            if (rawTeams.length === 0) {
              lastError = 'Nessuna squadra trovata';
              continue;
            }

            const girone = SID_TO_GIRONE[sid];
            rawTeams.forEach((rt) => {
              allTeams.push(mapApiToTeamStats(rt, girone));
            });

            success = true;
            break;
          } catch (e: any) {
            lastError = e.message;
            console.error(`Errore con URL ${url}:`, e);
          }
        }

        if (!success) {
          throw new Error(`Impossibile caricare dati per girone ${SID_TO_GIRONE[sid]}: ${lastError}`);
        }
      }

      if (allTeams.length === 0) {
        throw new Error('Nessuna squadra caricata da nessun girone');
      }

      setTeams(allTeams);
      setAvulsa([]);
      setMatches([]);
      setCurrentStep(2);
      setError(null);
    } catch (e: any) {
      console.error('Errore nel caricamento:', e);
      setError(e.message ?? 'Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeamField = (
    id: string,
    field: keyof TeamStats,
    value: number
  ) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        
        const updated = { ...t, [field]: value };
        
        // Ricalcola QS e QP quando cambiano i valori correlati
        if (field === 'SV' || field === 'SP') {
          updated.QS = updated.SP > 0 ? updated.SV / updated.SP : updated.SV;
        }
        if (field === 'PF' || field === 'PS') {
          updated.QP = updated.PS > 0 ? updated.PF / updated.PS : updated.PF;
        }
        
        return updated;
      })
    );
  };

  const computeAvulsaAndBracket = () => {
    if (teams.length === 0) {
      setError('Nessuna squadra caricata');
      return;
    }

    const byGirone: Record<Girone, TeamStats[]> = {
      A: [],
      B: [],
      C: [],
      D: [],
    };

    teams.forEach((t) => {
      byGirone[t.girone].push(t);
    });

    // Prime 2 per girone
    const qualified: TeamStats[] = [];
    (['A', 'B', 'C', 'D'] as Girone[]).forEach((g) => {
      const sorted = [...byGirone[g]].sort(compareTeams);
      qualified.push(...sorted.slice(0, 2));
    });

    // Classifica avulsa
    const avulsaSorted = [...qualified].sort(compareTeams);
    avulsaSorted.forEach((team, idx) => {
      team.caPosition = idx + 1;
    });
    
    setAvulsa(avulsaSorted);

    if (avulsaSorted.length !== 8) {
      setError('Numero di squadre qualificate non valido');
      setMatches([]);
      return;
    }

    // Genera accoppiamenti quarti
    const qf = findValidQFPairings(avulsaSorted);
    if (!qf) {
      setError('Impossibile generare gli accoppiamenti');
      return;
    }

    // Genera struttura semifinali e finali
    const sf: KnockoutMatch[] = [
      {
        id: 'SF1',
        round: 'SF',
        label: 'Semifinale 1',
        home: null,
        away: null,
        date: 'Sabato 14 o Domenica 15 Marzo 2026'
      },
      {
        id: 'SF2',
        round: 'SF',
        label: 'Semifinale 2',
        home: null,
        away: null,
        date: 'Sabato 14 o Domenica 15 Marzo 2026'
      },
    ];

    const finals: KnockoutMatch[] = [
      {
        id: 'F1',
        round: 'F',
        label: 'Finale 1°-2° posto',
        home: null,
        away: null,
        date: 'Domenica 22 Marzo 2026'
      },
      {
        id: 'F3P',
        round: '3P',
        label: 'Finale 3°-4° posto',
        home: null,
        away: null,
        date: 'Sabato 21 o Domenica 22 Marzo 2026'
      },
    ];

    setMatches([...qf, ...sf, ...finals]);
    setCurrentStep(3);
    setError(null);
  };

  const gironi: Girone[] = ['A', 'B', 'C', 'D'];

  const teamsByGirone: Record<Girone, TeamStats[]> = gironi.reduce(
    (acc, g) => {
      acc[g] = teams.filter((t) => t.girone === g).sort(compareTeams);
      return acc;
    },
    { A: [], B: [], C: [], D: [] } as Record<Girone, TeamStats[]>
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🏐 Simulatore Fasi Finali Under 18 Femminile</h1>
        <p className="subtitle">FIPAV Bergamo - Campionato 2025/2026</p>
      </header>

      {/* STEP 1: Caricamento Dati */}
      <section className={`card step-section ${currentStep >= 1 ? 'active' : ''}`}>
        <div className="step-header">
          <span className="step-number">1</span>
          <h2>Recupero Dati dalle Classifiche</h2>
        </div>
        
        <div className="step-content">
          <p className="info-text">
            Carica i dati attuali delle classifiche dei 4 gironi (A, B, C, D) dal sistema MatchShare.
          </p>
          
          <button 
            onClick={handleLoadData} 
            disabled={loading}
            className="primary-button"
          >
            {loading ? '⏳ Caricamento in corso...' : '📥 Carica Classifiche'}
          </button>
          
          {error && (
            <div className="error-message">
              <strong>⚠️ Errore:</strong> {error}
            </div>
          )}
          
          {teams.length > 0 && (
            <div className="success-message">
              ✅ Caricate {teams.length} squadre da {SIDS.length} gironi
            </div>
          )}
        </div>
      </section>

      {/* STEP 2: Modifica Dati */}
      {teams.length > 0 && (
        <section className={`card step-section ${currentStep >= 2 ? 'active' : ''}`}>
          <div className="step-header">
            <span className="step-number">2</span>
            <h2>Modifica Dati e Simulazione Scenari</h2>
          </div>
          
          <div className="step-content">
            <p className="info-text">
              Modifica i valori per simulare diversi scenari di fine campionato.
              I quozienti (QS, QP) vengono ricalcolati automaticamente.
            </p>

            {gironi.map((g) => (
              <div key={g} className="girone-section">
                <h3 className="girone-title">{GIRONE_NAMES[g]}</h3>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="sticky-col">Pos</th>
                        <th className="sticky-col">Squadra</th>
                        <th>P</th>
                        <th>G</th>
                        <th>V</th>
                        <th>Pe</th>
                        <th>SV</th>
                        <th>SP</th>
                        <th>QS</th>
                        <th>PF</th>
                        <th>PS</th>
                        <th>QP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamsByGirone[g].map((t, idx) => (
                        <tr key={t.id} className={idx < 2 ? 'qualified-row' : ''}>
                          <td className="sticky-col pos-col">{idx + 1}</td>
                          <td className="sticky-col team-name">{t.name}</td>
                          {(
                            [
                              'P',
                              'G',
                              'V',
                              'Pe',
                              'SV',
                              'SP',
                              'QS',
                              'PF',
                              'PS',
                              'QP',
                            ] as (keyof TeamStats)[]
                          ).map((field) => (
                            <td key={field}>
                              <input
                                type="number"
                                value={field === 'QS' || field === 'QP' ? t[field].toFixed(3) : t[field]}
                                className="data-input"
                                step={field === 'QS' || field === 'QP' ? '0.001' : '1'}
                                onChange={(e) =>
                                  handleUpdateTeamField(
                                    t.id,
                                    field,
                                    Number(e.target.value)
                                  )
                                }
                                disabled={field === 'QS' || field === 'QP'}
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
            ))}

            <button onClick={computeAvulsaAndBracket} className="primary-button">
              🔄 Calcola Classifica Avulsa e Tabellone
            </button>
          </div>
        </section>
      )}

      {/* STEP 3: Risultati */}
      {avulsa.length === 8 && (
        <section className={`card step-section ${currentStep >= 3 ? 'active' : ''}`}>
          <div className="step-header">
            <span className="step-number">3</span>
            <h2>Classifica Avulsa e Tabellone Playoff</h2>
          </div>
          
          <div className="step-content">
            {/* Classifica Avulsa */}
            <div className="avulsa-section">
              <h3>📊 Classifica Avulsa (Prime 2 per Girone)</h3>
              <div className="table-container">
                <table className="avulsa-table">
                  <thead>
                    <tr>
                      <th>Pos C.A.</th>
                      <th>Squadra</th>
                      <th>Girone</th>
                      <th>Punti</th>
                      <th>QS</th>
                      <th>QP</th>
                      <th>Diff. Punti</th>
                    </tr>
                  </thead>
                  <tbody>
                    {avulsa.map((t, idx) => (
                      <tr key={t.id}>
                        <td className="position-cell">{idx + 1}°</td>
                        <td className="team-name-cell">{t.name}</td>
                        <td>
                          <span className={`girone-badge girone-${t.girone}`}>
                            {t.girone}
                          </span>
                        </td>
                        <td><strong>{t.P}</strong></td>
                        <td>{t.QS.toFixed(3)}</td>
                        <td>{t.QP.toFixed(3)}</td>
                        <td>{t.PF - t.PS}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabellone */}
            {matches.length > 0 && (
              <div className="bracket-section">
                <h3>🏆 Tabellone Playoff</h3>

                {/* Quarti di Finale */}
                <div className="round-section">
                  <h4 className="round-title">Quarti di Finale</h4>
                  <p className="round-date">📅 Sabato 7 o Domenica 8 Marzo 2026</p>
                  
                  <div className="matches-grid">
                    {matches
                      .filter((m) => m.round === 'QF')
                      .map((m) => (
                        <div key={m.id} className={`match-card ${m.conflict ? 'conflict' : ''}`}>
                          <div className="match-header">
                            {m.label}
                            {m.conflict && (
                              <span className="warning-badge">⚠️ Stesso Girone</span>
                            )}
                          </div>
                          <div className="match-teams">
                            <div className="team-line">
                              <span className="seed">{m.home?.caPosition}°</span>
                              <span className="team">{m.home?.name}</span>
                              <span className={`girone-badge girone-${m.home?.girone}`}>
                                {m.home?.girone}
                              </span>
                            </div>
                            <div className="vs">vs</div>
                            <div className="team-line">
                              <span className="seed">{m.away?.caPosition}°</span>
                              <span className="team">{m.away?.name}</span>
                              <span className={`girone-badge girone-${m.away?.girone}`}>
                                {m.away?.girone}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {matches.some(m => m.round === 'QF' && m.conflict) && (
                    <div className="warning-message">
                      <strong>⚠️ Attenzione:</strong> Sono presenti accoppiamenti con squadre dello stesso girone.
                      Secondo il regolamento, questi dovrebbero essere evitati ai quarti di finale.
                    </div>
                  )}
                </div>

                {/* Semifinali */}
                <div className="round-section">
                  <h4 className="round-title">Semifinali</h4>
                  <p className="round-date">📅 Sabato 14 o Domenica 15 Marzo 2026</p>
                  
                  <div className="matches-grid">
                    <div className="match-card">
                      <div className="match-header">Semifinale 1</div>
                      <div className="match-teams">
                        <div className="team-line placeholder">
                          Vincente QF1
                        </div>
                        <div className="vs">vs</div>
                        <div className="team-line placeholder">
                          Vincente QF4
                        </div>
                      </div>
                    </div>

                    <div className="match-card">
                      <div className="match-header">Semifinale 2</div>
                      <div className="match-teams">
                        <div className="team-line placeholder">
                          Vincente QF2
                        </div>
                        <div className="vs">vs</div>
                        <div className="team-line placeholder">
                          Vincente QF3
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Finali */}
                <div className="round-section finals">
                  <h4 className="round-title">Finali</h4>
                  
                  <div className="matches-grid">
                    <div className="match-card final">
                      <div className="match-header">🥇 Finale 1° - 2° posto</div>
                      <p className="round-date">📅 Domenica 22 Marzo 2026</p>
                      <div className="match-teams">
                        <div className="team-line placeholder">
                          Vincente SF1
                        </div>
                        <div className="vs">vs</div>
                        <div className="team-line placeholder">
                          Vincente SF2
                        </div>
                      </div>
                    </div>

                    <div className="match-card bronze">
                      <div className="match-header">🥉 Finale 3° - 4° posto</div>
                      <p className="round-date">📅 Sabato 21 o Domenica 22 Marzo 2026</p>
                      <div className="match-teams">
                        <div className="team-line placeholder">
                          Perdente SF1
                        </div>
                        <div className="vs">vs</div>
                        <div className="team-line placeholder">
                          Perdente SF2
                        </div>
                      </div>
                      <p className="match-note">
                        ℹ️ In casa della squadra meglio classificata nella C.A.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <footer className="app-footer">
        <p>Simulatore Fasi Finali Under 18 Femminile - FIPAV Bergamo</p>
        <p className="small">
          Regolamento: prime 2 squadre per girone accedono ai quarti (accoppiamenti secondo classifica avulsa)
        </p>
      </footer>
    </div>
  );
};

export default App;
