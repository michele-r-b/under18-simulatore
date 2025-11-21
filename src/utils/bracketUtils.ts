/**
 * Funzioni per la generazione del tabellone playoff
 */

import type { TeamStats, KnockoutMatch } from '../types';
import { PLAYOFF_DATES } from '../constants';
import { canMeetInQF } from './teamUtils';

/**
 * Genera gli accoppiamenti dei quarti di finale
 */
export function generateQuarterFinals(rankedTeams: TeamStats[]): KnockoutMatch[] | null {
  if (rankedTeams.length !== 8) return null;

  // Accoppiamento standard secondo classifica avulsa: 1-8, 2-7, 3-6, 4-5
  const pairings = [
    { home: rankedTeams[0], away: rankedTeams[7], label: 'QF1', num: 1 },
    { home: rankedTeams[1], away: rankedTeams[6], label: 'QF2', num: 2 },
    { home: rankedTeams[2], away: rankedTeams[5], label: 'QF3', num: 3 },
    { home: rankedTeams[3], away: rankedTeams[4], label: 'QF4', num: 4 },
  ];

  return pairings.map((p) => ({
    id: p.label,
    round: 'QF' as const,
    label: `Quarto di Finale ${p.num}`,
    home: p.home,
    away: p.away,
    conflict: !canMeetInQF(p.home, p.away),
    date: PLAYOFF_DATES.QF,
  }));
}

/**
 * Genera le semifinali (placeholder)
 */
export function generateSemiFinals(): KnockoutMatch[] {
  return [
    {
      id: 'SF1',
      round: 'SF',
      label: 'Semifinale 1',
      home: null,
      away: null,
      date: PLAYOFF_DATES.SF,
    },
    {
      id: 'SF2',
      round: 'SF',
      label: 'Semifinale 2',
      home: null,
      away: null,
      date: PLAYOFF_DATES.SF,
    },
  ];
}

/**
 * Genera le finali (placeholder)
 */
export function generateFinals(): KnockoutMatch[] {
  return [
    {
      id: 'F1',
      round: 'F',
      label: 'Finale 1°-2° posto',
      home: null,
      away: null,
      date: PLAYOFF_DATES.FINAL,
    },
    {
      id: 'F3P',
      round: '3P',
      label: 'Finale 3°-4° posto',
      home: null,
      away: null,
      date: PLAYOFF_DATES.BRONZE,
    },
  ];
}

/**
 * Genera l'intero tabellone playoff
 */
export function generateBracket(rankedTeams: TeamStats[]): KnockoutMatch[] | null {
  const qf = generateQuarterFinals(rankedTeams);
  if (!qf) return null;

  const sf = generateSemiFinals();
  const finals = generateFinals();

  return [...qf, ...sf, ...finals];
}

/**
 * Verifica se ci sono conflitti nei quarti (stesso girone)
 */
export function hasQuarterFinalConflicts(matches: KnockoutMatch[]): boolean {
  return matches
    .filter((m) => m.round === 'QF')
    .some((m) => m.conflict === true);
}
