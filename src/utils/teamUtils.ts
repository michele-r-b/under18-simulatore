/**
 * Funzioni di utilità per calcoli e ordinamenti
 */

/**
 * Funzioni di utilità per calcoli e ordinamenti
 */
import type { TeamStats, ApiTeamRaw, Girone } from '../types';

/**
 * Mappa i dati raw dall'API a TeamStats
 */
export function mapApiToTeamStats(rawTeam: ApiTeamRaw, girone: Girone): TeamStats {
  const id = String(rawTeam.team_id ?? `${girone}-unknown-${Math.random()}`);
  const name = String(rawTeam.disp ?? 'SQUADRA');
  
  const SetVinti = Number(rawTeam.sw ?? 0);
  const SetPersi = Number(rawTeam.sl ?? 0);
  const PuntiFatti = Number(rawTeam.pw ?? 0);
  const PuntiSubiti = Number(rawTeam.pl ?? 0);
  const PuntiCampionato = Number(rawTeam.points ?? 0);
  const GareGiocate = Number(rawTeam.gp ?? 0);
  const GareVinte = Number(rawTeam.w ?? 0);
  const GarePerse = Number(rawTeam.l ?? 0);
  
  const QuozienteSet = SetPersi > 0 ? SetVinti / SetPersi : 999;
  const QuozientePunti = PuntiFatti / PuntiSubiti ;
  const QuozienteGare =  PuntiCampionato / GareGiocate ;

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

/**
 * Confronta due squadre secondo i criteri del regolamento:
 * 1. Punti campionato
 * 2. Quoziente set
 * 3. Quoziente punti
 * 4. Differenza punti
 * 5. Ordine alfabetico
 */
export function compareTeams(a: TeamStats, b: TeamStats): number {
  // 1) Quoziente gare
  if (b.PuntiCampionato !== a.PuntiCampionato) {
    return b.PuntiCampionato - a.PuntiCampionato;
  }
  
  // 2) Quoziente set
  if (Math.abs(b.QuozienteSet - a.QuozienteSet) > 0.001) {
    return b.QuozienteSet - a.QuozienteSet;
  }
  
  // 3) Quoziente punti
  if (Math.abs(b.QuozientePunti - a.QuozientePunti) > 0.001) {
    return b.QuozientePunti - a.QuozientePunti;
  }
  
  // Se tutto è uguale, mantieni ordine originale
  return 0;
}


/**
 * Confronta due squadre secondo i criteri del regolamento Avulsa:
 * 1. Punti campionato
 * 2. Quoziente set
 * 3. Quoziente punti
 * 4. Differenza punti
 * 5. Ordine alfabetico
 */
export function compareTeamsA(a: TeamStats, b: TeamStats): number {
  // 1) Quoziente gare
  if (b.QuozienteGare !== a.QuozienteGare) {
    return b.QuozienteGare - a.QuozienteGare;
  }
  
  // 2) Quoziente set
  if (Math.abs(b.QuozienteSet - a.QuozienteSet) > 0.001) {
    return b.QuozienteSet - a.QuozienteSet;
  }
  
  // 3) Quoziente punti
  if (Math.abs(b.QuozientePunti - a.QuozientePunti) > 0.001) {
    return b.QuozientePunti - a.QuozientePunti;
  }
  
  // Se tutto è uguale, mantieni ordine originale
  return 0;
}
/**
 * Ricalcola i quozienti automatici quando cambiano i valori
 */
export function recalculateQuotients(
  team: TeamStats,
  field: keyof TeamStats,
  value: number
): TeamStats {
  const updated = { ...team, [field]: value };
  
  // Ricalcola QuozienteSet
  if (field === 'SetVinti' || field === 'SetPersi') {
    updated.QuozienteSet = updated.SetPersi > 0 
      ? updated.SetVinti / updated.SetPersi 
      : 999;
  }
  
  // Ricalcola QuozientePunti
  if (field === 'PuntiFatti' || field === 'PuntiSubiti') {
    updated.QuozientePunti = updated.PuntiFatti / updated.PuntiSubiti ;
  }
  
  // Ricalcola QuozienteGare
  if (field === 'GareVinte' || field === 'GarePerse' || field === 'PuntiCampionato' ||field === 'GareGiocate') {
    updated.QuozienteGare = updated.PuntiCampionato / updated.GareGiocate;
  }
  
  return updated;
}

/**
 * Verifica se due squadre possono incontrarsi ai quarti
 * (devono essere di gironi diversi)
 */
export function canMeetInQF(team1: TeamStats, team2: TeamStats): boolean {
  return team1.girone !== team2.girone;
}

/**
 * Raggruppa le squadre per girone
 */
export function groupTeamsByGirone(teams: TeamStats[]): Record<Girone, TeamStats[]> {
  const grouped: Record<Girone, TeamStats[]> = {
    A: [],
    B: [],
    C: [],
    D: [],
  };
  
  teams.forEach((team) => {
    grouped[team.girone].push(team);
  });
  
  // Ordina ogni girone
  (['A', 'B', 'C', 'D'] as Girone[]).forEach((g) => {
    grouped[g].sort(compareTeams);
  });
  
  return grouped;
}

/**
 * Estrae le squadre qualificate (prime 2 per girone)
 */
export function getQualifiedTeams(teams: TeamStats[]): TeamStats[] {
  const byGirone = groupTeamsByGirone(teams);
  const qualified: TeamStats[] = [];
  
  (['A', 'B', 'C', 'D'] as Girone[]).forEach((g) => {
    const sorted = byGirone[g];
    qualified.push(...sorted.slice(0, 2));
  });
  
  return qualified;
}

/**
 * Calcola la classifica avulsa
 */
export function calculateAvulsa(teams: TeamStats[]): TeamStats[] {
  const byGirone = groupTeamsByGirone(teams);

  // Regole:
  // 1) prevale la classifica del proprio girone -> prima le prime classificate, poi le seconde
  const primeDiGirone: TeamStats[] = [];
  const secondeDiGirone: TeamStats[] = [];

  (['A', 'B', 'C', 'D'] as Girone[]).forEach((g) => {
    const ranking = byGirone[g];
    if (ranking[0]) primeDiGirone.push(ranking[0]);
    if (ranking[1]) secondeDiGirone.push(ranking[1]);
  });

  // 2) posizioni 1-4 con le prime, ordinate dai criteri generali
  const primeOrdinate = [...primeDiGirone].sort(compareTeamsA);

  // 3) posizioni 5-8 con le seconde, ordinate dai criteri generali
  const secondeOrdinate = [...secondeDiGirone].sort(compareTeamsA);

  const avulsa = [...primeOrdinate, ...secondeOrdinate];

  avulsa.forEach((team, idx) => {
    team.caPosition = idx + 1;
  });

  return avulsa;
}


export function calculateMatchStats(
  result: '3-0' | '3-1' | '3-2' | '0-3' | '1-3' | '2-3',
  isHomeTeam: boolean
): {
  puntiCampionato: number;
  setVinti: number;
  setPersi: number;
  puntiFatti: number;
  puntiSubiti: number;
  gareVinte: number;
  garePerse: number;
} {
  const setPoints = 25;
  const setPointsLost = 15;
  const tieBreakWin = 15; // 5° set vincitore
  const tieBreakLose = 10; // 5° set perdente

  // Determina vincitore e perdente in base al risultato
  let homeWins = parseInt(result[0]);
  let awayWins = parseInt(result[2]);
  
  const homeIsWinner = homeWins > awayWins;
  const isWinner = isHomeTeam ? homeIsWinner : !homeIsWinner;
  
  let setVinti, setPersi, puntiFatti, puntiSubiti, puntiCampionato;

  if (isHomeTeam) {
    setVinti = homeWins;
    setPersi = awayWins;
  } else {
    setVinti = awayWins;
    setPersi = homeWins;
  }

  // Calcola punti fatti/subiti
  const totalSets = setVinti + setPersi;
  const is5Sets = totalSets === 5;

  if (is5Sets) {
    // Match a 5 set: primi 4 set normali (25-15), 5° set tie-break (15-10)
    if (isWinner) {
      puntiFatti = (setPoints * 3) + tieBreakWin + (setPointsLost * setPersi);
      puntiSubiti = (setPoints * setPersi) + tieBreakLose + (setPointsLost * 3);
    } else {
      puntiFatti = (setPoints * setPersi) + tieBreakLose + (setPointsLost * 3);
      puntiSubiti = (setPoints * 3) + tieBreakWin + (setPointsLost * setPersi);
    }
    // Punti campionato per 3-2 o 2-3
    puntiCampionato = isWinner ? 2 : 1;
  } else {
    // Match a 3 o 4 set: tutti i set normali (25-15)
    puntiFatti = (setPoints * setVinti) + (setPointsLost * setPersi);
    puntiSubiti = (setPoints * setPersi) + (setPointsLost * setVinti);
    
    // Punti campionato
    if (setPersi === 0) {
      // 3-0 o 0-3
      puntiCampionato = isWinner ? 3 : 0;
    } else {
      // 3-1 o 1-3
      puntiCampionato = isWinner ? 3 : 0;
    }
  }

  return {
    puntiCampionato,
    setVinti,
    setPersi,
    puntiFatti,
    puntiSubiti,
    gareVinte: isWinner ? 1 : 0,
    garePerse: isWinner ? 0 : 1,
  };
}

/**
 * Applica il risultato di una partita a due squadre
 */
export function applyMatchResult(
  teams: TeamStats[],
  homeTeamId: string,
  awayTeamId: string,
  result: '3-0' | '3-1' | '3-2' | '0-3' | '1-3' | '2-3'
): TeamStats[] {
  return teams.map((team) => {
    if (team.id !== homeTeamId && team.id !== awayTeamId) {
      return team;
    }

    const isHomeTeam = team.id === homeTeamId;
    const stats = calculateMatchStats(result, isHomeTeam);

   const updated = {
      ...team,
      GareGiocate: team.GareGiocate + 1,
      GareVinte: team.GareVinte + stats.gareVinte,
      GarePerse: team.GarePerse + stats.garePerse,
      PuntiCampionato: team.PuntiCampionato + stats.puntiCampionato,
      SetVinti: team.SetVinti + stats.setVinti,
      SetPersi: team.SetPersi + stats.setPersi,
      PuntiFatti: team.PuntiFatti + stats.puntiFatti,
      PuntiSubiti: team.PuntiSubiti + stats.puntiSubiti,
    };

    // Ricalcola i quozienti
    updated.QuozienteSet = updated.SetPersi > 0 ? updated.SetVinti / updated.SetPersi : 999;
    updated.QuozientePunti = updated.PuntiSubiti > 0 ? updated.PuntiFatti / updated.PuntiSubiti : updated.PuntiFatti;
    updated.QuozienteGare = updated.GareGiocate > 0 ? updated.PuntiCampionato / updated.GareGiocate : updated.PuntiCampionato;

    return updated;
  });
}
