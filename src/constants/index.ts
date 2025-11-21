/**
 * Costanti globali dell'applicazione
 */

/**
 * Costanti globali dell'applicazione
 */
import type { Girone } from '../types';

// Mapping tra Season ID e Girone
export const SID_TO_GIRONE: Record<number, Girone> = {
  315: 'A',
  316: 'B',
  317: 'C',
  318: 'D',
};

// Nomi dei gironi
export const GIRONE_NAMES: Record<Girone, string> = {
  'A': 'Girone A',
  'B': 'Girone B',
  'C': 'Girone C',
  'D': 'Girone D',
};

// Season IDs da caricare
export const SIDS = [315, 316, 317, 318];

// Funzione per generare gli URL dell'API
export const CLASSIFICA_URLS = (sid: number): string[] => [
  `/matchshare/stats_test/rest_api/ranks2?client_name=fipavbergamo&season_id=${sid}`,
  `/matchshare/stats_test/rest_api/fm_classifica?sid=${sid}&client_name=fipavbergamo`
];

// Date delle fasi finali
export const PLAYOFF_DATES = {
  QF: 'Sabato 7 o Domenica 8 Marzo 2026',
  SF: 'Sabato 14 o Domenica 15 Marzo 2026',
  FINAL: 'Domenica 22 Marzo 2026',
  BRONZE: 'Sabato 21 o Domenica 22 Marzo 2026',
} as const;

// Configurazione playoff
export const PLAYOFF_CONFIG = {
  TEAMS_PER_GIRONE: 2,
  TOTAL_QUALIFIED: 8,
  QF_MATCHES: 4,
  SF_MATCHES: 2,
} as const;
