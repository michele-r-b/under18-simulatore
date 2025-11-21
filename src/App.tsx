import React, { useState } from 'react';
import './App.css';

type Girone = 'A' | 'B' | 'C' | 'D';

interface TeamStats {
  id: string;
  name: string;
  girone: Girone;
  PuntiCampionato: number;   // punti
  GareGiocate: number;   // giocate
  GareVinte: number;   // vinte
  GarePerse: number;  // perse
  SetVinti: number;  // set vinti
  SetPersi: number;  // set persi
  QuozienteSet: number;  // quoziente set
  PuntiFatti: number;  // punti fatti
  PuntiSubiti: number;  // punti subiti
  QuozientePunti: number;  // quoziente punti
  QuozienteGare: number;  // quoziente gare
  ClassificaAvulsa?: number; // posizione in classifica avulsa
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
  const id = String(rawTeam.team_id ?? `${girone}-unknown-${Math.random()}`); // id squadra
  
  const name = String(
    rawTeam.disp ?? 
    'SQUADRA'
  ); // nome squadra

  // Calcola QuozienteSet e QuozientePunti se non presenti
  const SetVinti = Number(rawTeam.sw ?? 0); // set vinti
  const SetPersi = Number(rawTeam.sl ?? 0); // set persi
  const PuntiFatti = Number(rawTeam.pw ?? 0); // punti fatti
  const PuntiSubiti = Number(rawTeam.pl ?? 0); // punti subiti
  const PuntiCampionato = Number(rawTeam.points ?? 0); // punti campionato
  const GareGiocate =  Number(rawTeam.gp ?? 0); // gare giocate
  const GareVinte = Number(rawTeam.w ?? 0); // gare vinte
  const GarePerse = Number(rawTeam.l ?? 0); // gare perse
  
  const QuozienteSet = SetPersi > 0 ? SetVinti / SetPersi : 999; // quoziente set
  const QuozientePunti = PuntiSubiti > 0 ? PuntiFatti / PuntiSubiti : 0; // quoziente punti
  const QuozienteGare = PuntiCampionato / GareGiocate ; // quoziente gare
  


  return {
    id,
    name,
    girone,
    PuntiCampionato,
    GareGiocate,
    GareVinte,
    GarePerse,
    SetVinti,
    SetPersi,
    QuozienteSet,
    PuntiFatti,
    PuntiSubiti,
    QuozientePunti,
    QuozienteGare,
  };
}

function compareTeams(a: TeamStats, b: TeamStats): number {
  // 1) Punti
  if (b.PuntiCampionato !== a.PuntiCampionato) return b.PuntiCampionato - a.PuntiCampionato;
  // 2) Quoziente set
  if (Math.abs(b.QuozienteSet - a.QuozienteSet) > 0.001) return b.QuozienteSet - a.QuozienteSet;
  // 3) Quoziente punti
  if (Math.abs(b.QuozientePunti - a.QuozientePunti) > 0.001) return b.QuozientePunti - a.QuozientePunti;
  // 4) differenza punti
  const diffA = a.PuntiFatti - a.PuntiSubiti;
  const diffB = b.PuntiFatti - b.PuntiSubiti;
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
      const failedGironi: string[] = [];

      for (const sid of SIDS) {
        const urls = CLASSIFICA_URLS(sid);
        let success = false;
        let lastError = '';
        let responsePreview = '';

        // Prova entrambi gli endpoint
        for (const url of urls) {
          try {
            console.log('🔄 Tentativo fetch:', url);
            const res = await fetch(url);
            const text = await res.text();
            responsePreview = text.substring(0, 500);
            
            console.log(`📡 Status: ${res.status}`, {
              contentType: res.headers.get('content-type'),
              preview: responsePreview
            });

            if (!res.ok) {
              lastError = `HTTP ${res.status} - ${res.statusText}`;
              console.warn(`⚠️ ${lastError}`);
              continue;
            }

            // Verifica se la risposta è HTML (errore comune)
            if (text.trim().startsWith('<')) {
              lastError = 'Risposta HTML invece di JSON (possibile errore di autenticazione o CORS)';
              console.warn(`⚠️ ${lastError}`, responsePreview);
              continue;
            }

            let json: any;
            try {
              json = JSON.parse(text);
            } catch (parseErr) {
              lastError = 'Risposta non JSON valida';
              console.warn(`⚠️ ${lastError}`, {
                preview: responsePreview,
                error: parseErr
              });
              continue;
            }


            // ⭐ PERCORSO CORRETTO: ranks.seasons[0].rank
            let rawTeams: RawTeamFromApi[] = [];
            
            try {
              if (json.ranks && 
                  json.ranks.seasons && 
                  Array.isArray(json.ranks.seasons) && 
                  json.ranks.seasons.length > 0) {
                
                // ✅ Accesso corretto: seasons è un array, usiamo l'indice [0]
                const firstSeason = json.ranks.seasons[0];
                
                
                if (firstSeason && firstSeason.rank && Array.isArray(firstSeason.rank)) {
                  rawTeams = firstSeason.rank;
                
                } else {
                  console.warn('⚠️ seasons[0].rank non è un array o è vuoto:', firstSeason);
                }
              } else {
                console.warn('⚠️ Struttura ranks.seasons non trovata o non valida');
              }
            } catch (parseError) {
              console.error('❌ Errore nell\'accesso a ranks.seasons[0].rank:', parseError);
            }
            
            // Fallback per altre strutture se rawTeams è ancora vuoto
            if (rawTeams.length === 0) {
              console.log('🔄 Tentativo con strutture alternative...');
              rawTeams = Array.isArray(json)
                ? json
                : json.data ?? json.result ?? json.classifica ?? json.teams ?? [];
              
              if (rawTeams.length > 0) {
                continue;
              }
            }

            if (rawTeams.length === 0) {
              lastError = 'Nessuna squadra trovata nella risposta JSON';
              console.warn(`⚠️ ${lastError}`);
              
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
            console.error(`❌ Errore con URL ${url}:`, e);
          }
        }

        if (!success) {
          const girone = SID_TO_GIRONE[sid];
          failedGironi.push(`${girone} (${lastError})`);
          console.error(`❌ Impossibile caricare girone ${girone}`);
        }
      }

      if (allTeams.length === 0) {
        throw new Error(
          `Impossibile caricare dati da nessun girone.\n\n` +
          `Errori:\n${failedGironi.join('\n')}\n\n` +
          `Possibili cause:\n` +
          `• API richiede autenticazione\n` +
          `• CORS bloccato dal browser\n` +
          `• Endpoint cambiati\n` +
          `• Problema di rete\n\n` +
          `Soluzione: Usa "Carica Dati di Esempio" per testare l'app.`
        );
      }

      // Se alcuni gironi sono falliti, mostra un warning
      if (failedGironi.length > 0) {
        setError(
          `⚠️ Caricati solo ${allTeams.length} squadre. ` +
          `Errori per: ${failedGironi.join(', ')}`
        );
      }

      setTeams(allTeams);
      setAvulsa([]);
      setMatches([]);
      setCurrentStep(2);
      
      if (failedGironi.length === 0) {
        setError(null);
      }
    } catch (e: any) {
      console.error('❌ Errore generale nel caricamento:', e);
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
        
        // Ricalcola QuozienteSet, QuozienteGare e QuozientePunti quando cambiano i valori correlati
        if (field === 'SetVinti' || field === 'SetPersi') {
          updated.QuozienteSet = updated.SetPersi > 0 ? updated.SetVinti / updated.SetPersi : updated.SetVinti;
        }
        if (field === 'PuntiFatti' || field === 'PuntiSubiti') {
          updated.QuozientePunti = updated.PuntiSubiti > 0 ? updated.PuntiFatti / updated.PuntiSubiti : updated.PuntiFatti;
        }
        if (field === 'PuntiFatti' || field === 'PuntiSubiti') {
          updated.QuozientePunti = updated.PuntiSubiti > 0 ? updated.PuntiFatti / updated.PuntiSubiti : updated.PuntiFatti;
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
      team.ClassificaAvulsa = idx + 1;
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
            Carica i dati attuali delle classifiche dei 4 gironi (A, B, C, D) Under 18 Femminile
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={handleLoadData} 
              disabled={loading}
              className="primary-button"
            >
              {loading ? '⏳ Caricamento in corso...' : '📥 Carica Partite'}
            </button>
            
      
          </div>
          
          {error && (
            <div className="error-message">
              <strong>⚠️ Errore:</strong>
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                marginTop: '0.5rem',
                fontSize: '0.9rem',
                lineHeight: '1.4'
              }}>{error}</pre>
              <p style={{ marginTop: '1rem', fontSize: '0.95rem' }}>
                💡 <strong>Suggerimento:</strong> Se l'API non è raggiungibile, usa i "Dati di Esempio" 
                per testare tutte le funzionalità dell'applicazione.
              </p>
            </div>
          )}
          
          {teams.length > 0 && (
            <div className="success-message">
              ✅ Caricate {teams.length} squadre da {new Set(teams.map(t => t.girone)).size} gironi
            </div>
          )}
          
          <div className="info-box" style={{ marginTop: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>ℹ️ Informazioni sul caricamento</h4>
            <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
              <li><strong>Dati:</strong> Tenterà il recupero dati, ogni richiesta sovrascrive i dati</li>
              <li><strong>Simulazione:</strong> Dopo si possono fare simulazioni</li>
            </ul>
          </div>
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
              I quozienti (QuozienteSet, QuozientePunti) vengono ricalcolati automaticamente.
            </p>

            {gironi.map((g) => (
              <div key={g} className="girone-section">
                <h3 className="girone-title">{GIRONE_NAMES[g]}</h3>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="sticky-col">#</th>
                        <th className="sticky-col">Squadra</th>
                        <th>Gare</th>
                        <th>Punti</th>
                        <th>Vinte</th>
                        <th>Perse</th>
                        <th>Set Vinti</th>
                        <th>Set Persi</th>
                        <th>Punti<br/> Fatti</th>
                        <th>Punti<br/>Subiti</th>
                        <th>Quoziente<br/>Gare</th>
                        <th>Quoziente<br/>Set</th>
                        <th>Quoziente<br/> Punti</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamsByGirone[g].map((t, idx) => (
                        <tr key={t.id} className={idx < 2 ? 'qualified-row' : ''}>
                          <td className="sticky-col pos-col">{idx + 1}</td>
                          <td className="sticky-col team-name">{t.name}</td>
                          {(
                            [
                              'GareGiocate',
                              'PuntiCampionato',
                              'GareVinte',
                              'GarePerse',
                              'SetVinti',
                              'SetPersi',
                              'PuntiFatti',
                              'PuntiSubiti',
                              'QuozienteGare',
                              'QuozienteSet',
                              'QuozientePunti',
                            ] as (keyof TeamStats)[]
                          ).map((field) => (
                            <td key={field}>
                              <input
                                type="number"
                                value={field === 'QuozienteSet' || field === 'QuozienteGare' || field === 'QuozientePunti' ? t[field].toFixed(3) : t[field]}
                                className="data-input"
                                step='1'
                                onChange={(e) =>
                                  handleUpdateTeamField(
                                    t.id,
                                    field,
                                    Number(e.target.value)
                                  )
                                }
                                disabled={field === 'QuozienteSet' || field === 'QuozientePunti' || field === 'QuozienteGare'}
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
                    {avulsa.map((t, idx) => (
                      <tr key={t.id}>
                        <td className="position-cell">{idx + 1}°</td>
                        <td className="team-name-cell">{t.name}</td>
                        <td>
                          <span className={`girone-badge girone-${t.girone}`}>
                            {t.girone}
                          </span>
                        </td>
                        <td><strong>{t.PuntiCampionato}</strong></td>
                        <td>{t.QuozienteSet.toFixed(3)}</td>
                        <td>{t.QuozientePunti.toFixed(3)}</td>
                        <td>{t.PuntiFatti - t.PuntiSubiti}</td>
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
                              <span className="seed">{m.home?.ClassificaAvulsa}°</span>
                              <span className="team">{m.home?.name}</span>
                              <span className={`girone-badge girone-${m.home?.girone}`}>
                                {m.home?.girone}
                              </span>
                            </div>
                            <div className="vs">vs</div>
                            <div className="team-line">
                              <span className="seed">{m.away?.ClassificaAvulsa}°</span>
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
