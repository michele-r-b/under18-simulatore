import React, { useState } from 'react';

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
}

interface KnockoutMatch {
  id: string;
  round: 'QF' | 'SF' | 'F' | '3P';
  label: string;
  home: TeamStats | null;
  away: TeamStats | null;
  winnerId?: string;
  conflict?: boolean; // quarti con squadre stesso girone
}

const SID_TO_GIRONE: Record<number, Girone> = {
  315: 'A',
  316: 'B',
  317: 'C',
  318: 'D',
};

const SIDS = [315, 316, 317, 318];
// PRIMA
// const CLASSIFICA_URL = (sid: number) =>
//   `https://srv6.matchshare.it/stats_test/rest_api/fm_classifica?sid=${sid}&client_name=fipavbergamo`;

// DOPO: usiamo un path "locale" che poi proxyamo verso l'endpoint corretto "ranks2"
// NOTE: da Network risulta che il backend usa /ranks2?client_name=...&season_id=...
const CLASSIFICA_URL = (sid: number) =>
  `/matchshare/stats_test/rest_api/ranks2?client_name=fipavbergamo&season_id=${sid}`;

// TODO: tipo reale in base al JSON
type RawTeamFromApi = any;

// ⚠️ ADATTA QUESTO MAPPING AI CAMPI REALI DELLA RISPOSTA
function mapApiToTeamStats(rawTeam: RawTeamFromApi, girone: Girone): TeamStats {
  return {
    id: String(rawTeam.id_squadra ?? rawTeam.id ?? `${girone}-${rawTeam.nome}`),
    name: rawTeam.nome_squadra ?? rawTeam.nome ?? 'SQUADRA',
    P: Number(rawTeam.punti ?? rawTeam.P ?? 0),
    G: Number(rawTeam.giocate ?? rawTeam.G ?? 0),
    V: Number(rawTeam.vinte ?? rawTeam.V ?? 0),
    Pe: Number(rawTeam.perse ?? rawTeam.Pe ?? 0),
    SV: Number(rawTeam.set_vinti ?? rawTeam.SV ?? 0),
    SP: Number(rawTeam.set_persi ?? rawTeam.SP ?? 0),
    QS: Number(rawTeam.quoziente_set ?? rawTeam.QS ?? 0),
    PF: Number(rawTeam.punti_fatti ?? rawTeam.PF ?? 0),
    PS: Number(rawTeam.punti_subiti ?? rawTeam.PS ?? 0),
    QP: Number(rawTeam.quoziente_punti ?? rawTeam.QP ?? 0),
  };
}

function compareTeams(a: TeamStats, b: TeamStats): number {
  // 1) Punti
  if (b.P !== a.P) return b.P - a.P;
  // 2) Quoziente set
  if (b.QS !== a.QS) return b.QS - a.QS;
  // 3) Quoziente punti
  if (b.QP !== a.QP) return b.QP - a.QP;
  // 4) differenza punti
  const diffA = a.PF - a.PS;
  const diffB = b.PF - b.PS;
  if (diffB !== diffA) return diffB - diffA;
  // 5) fallback alfabetico
  return a.name.localeCompare(b.name);
}

const App: React.FC = () => {
  const [teams, setTeams] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avulsa, setAvulsa] = useState<TeamStats[]>([]);
  const [matches, setMatches] = useState<KnockoutMatch[]>([]);

  const handleLoadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const allTeams: TeamStats[] = [];

      for (const sid of SIDS) {
        const url = CLASSIFICA_URL(sid);
        console.log('Fetching URL:', url);

        const res = await fetch(url);

        // leggiamo SEMPRE il testo grezzo, così possiamo vedere esattamente cosa risponde il server
        const text = await res.text();
        console.log(`Risposta grezza per sid ${sid}:`, text);

        if (!res.ok) {
          // qui vedremo sia lo status che il body del server
          throw new Error(`HTTP ${res.status} per sid ${sid} – body: ${text}`);
        }

        let json: any;
        try {
          json = JSON.parse(text);
        } catch (parseErr: any) {
          // il server non sta rispondendo JSON valido
          throw new Error(
            `Risposta non JSON valida per sid ${sid}: ${text}`
          );
        }

        // qui devi capire come è strutturato il JSON (array diretto, json.data, ecc.)
        const rawTeams: RawTeamFromApi[] = Array.isArray(json)
          ? json
          : json.data ?? json.result ?? [];

        const girone = SID_TO_GIRONE[sid];
        rawTeams.forEach((rt) => {
          allTeams.push(mapApiToTeamStats(rt, girone));
        });
      }

      setTeams(allTeams);
      setAvulsa([]);
      setMatches([]);
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
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              [field]: value,
            }
          : t
      )
    );
  };

  const computeAvulsaAndBracket = () => {
    if (teams.length === 0) return;

    const byGirone: Record<Girone, TeamStats[]> = {
      A: [],
      B: [],
      C: [],
      D: [],
    };

    teams.forEach((t) => {
      byGirone[t.girone].push(t);
    });

    // prime 2 per girone
    const qualified: TeamStats[] = [];
    (['A', 'B', 'C', 'D'] as Girone[]).forEach((g) => {
      const sorted = [...byGirone[g]].sort(compareTeams);
      qualified.push(...sorted.slice(0, 2));
    });

    const avulsaSorted = [...qualified].sort(compareTeams);
    setAvulsa(avulsaSorted);

    if (avulsaSorted.length !== 8) {
      setMatches([]);
      return;
    }

    const qf: KnockoutMatch[] = [
      {
        id: 'QF1',
        round: 'QF',
        label: 'Quarto di Finale 1 (1C.A. - 8C.A.)',
        home: avulsaSorted[0],
        away: avulsaSorted[7],
      },
      {
        id: 'QF2',
        round: 'QF',
        label: 'Quarto di Finale 2 (2C.A. - 7C.A.)',
        home: avulsaSorted[1],
        away: avulsaSorted[6],
      },
      {
        id: 'QF3',
        round: 'QF',
        label: 'Quarto di Finale 3 (3C.A. - 6C.A.)',
        home: avulsaSorted[2],
        away: avulsaSorted[5],
      },
      {
        id: 'QF4',
        round: 'QF',
        label: 'Quarto di Finale 4 (4C.A. - 5C.A.)',
        home: avulsaSorted[3],
        away: avulsaSorted[4],
      },
    ].map((m) => ({
      ...m,
      conflict:
        m.home?.girone && m.away?.girone && m.home.girone === m.away.girone,
    }));

    const sf: KnockoutMatch[] = [
      {
        id: 'SF1',
        round: 'SF',
        label: 'Semifinale 1 (vinc. QF1 - vinc. QF4)',
        home: null,
        away: null,
      },
      {
        id: 'SF2',
        round: 'SF',
        label: 'Semifinale 2 (vinc. QF2 - vinc. QF3)',
        home: null,
        away: null,
      },
    ];

    const finals: KnockoutMatch[] = [
      {
        id: 'F1',
        round: 'F',
        label: 'Finale 1°-2° posto',
        home: null,
        away: null,
      },
      {
        id: 'F3P',
        round: '3P',
        label: 'Finale 3°-4° posto',
        home: null,
        away: null,
      },
    ];

    setMatches([...qf, ...sf, ...finals]);
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
    <div style={{ padding: '1rem', fontFamily: 'system-ui' }}>
      <h1>Under 18 Femminile - Simulatore Fasi Finali</h1>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2>1. Recupero dati</h2>
        <button onClick={handleLoadData} disabled={loading}>
          {loading ? 'Caricamento...' : 'Carica classifiche Under 18'}
        </button>
        {error && <p style={{ color: 'red' }}>Errore: {error}</p>}
      </section>

      {teams.length > 0 && (
        <>
          <section style={{ marginBottom: '1.5rem' }}>
            <h2>2. Modifica dati di classifica</h2>
            <p>
              Modifica i valori (P, G, V, Pe, SV, SP, QS, PF, PS, QP) per
              simulare scenari diversi.
            </p>

            {gironi.map((g) => (
              <div key={g} style={{ marginBottom: '1rem' }}>
                <h3>Girone {g}</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      borderCollapse: 'collapse',
                      minWidth: '800px',
                    }}
                  >
                    <thead>
                      <tr>
                        <th>Squadra</th>
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
                      {teamsByGirone[g].map((t) => (
                        <tr key={t.id}>
                          <td>{t.name}</td>
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
                                value={t[field]}
                                style={{ width: '4rem' }}
                                onChange={(e) =>
                                  handleUpdateTeamField(
                                    t.id,
                                    field,
                                    Number(e.target.value)
                                  )
                                }
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h2>3. Classifica avulsa & tabellone</h2>
            <button onClick={computeAvulsaAndBracket}>
              Calcola classifica avulsa e genera tabellone
            </button>

            {avulsa.length === 8 && (
              <div style={{ marginTop: '1rem' }}>
                <h3>Classifica Avulsa (prime 2 per girone)</h3>
                <table
                  style={{
                    borderCollapse: 'collapse',
                    minWidth: '600px',
                  }}
                >
                  <thead>
                    <tr>
                      <th>Pos</th>
                      <th>Squadra</th>
                      <th>Girone</th>
                      <th>P</th>
                      <th>QS</th>
                      <th>QP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {avulsa.map((t, idx) => (
                      <tr key={t.id}>
                        <td>{idx + 1}</td>
                        <td>{t.name}</td>
                        <td>{t.girone}</td>
                        <td>{t.P}</td>
                        <td>{t.QS.toFixed(3)}</td>
                        <td>{t.QP.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {matches.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h3>Tabellone</h3>

                <h4>Quarti di Finale</h4>
                <ul>
                  {matches
                    .filter((m) => m.round === 'QF')
                    .map((m) => (
                      <li key={m.id}>
                        <strong>{m.label}</strong>
                        {': '}
                        {m.home?.name} ({m.home?.girone}) vs{' '}
                        {m.away?.name} ({m.away?.girone}){' '}
                        {m.conflict && (
                          <span style={{ color: 'red', marginLeft: '0.5rem' }}>
                            ⚠ stesso girone, accoppiamento da rivedere
                          </span>
                        )}
                      </li>
                    ))}
                </ul>

                <h4>Semifinali e Finali</h4>
                <ul>
                  <li>SF1: vincente QF1 – vincente QF4</li>
                  <li>SF2: vincente QF2 – vincente QF3</li>
                  <li>Finale 1°-2°: vincenti SF1 e SF2</li>
                  <li>Finale 3°-4°: perdenti SF1 e SF2</li>
                </ul>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default App;