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
