/**
 * Tipi e interfacce per il simulatore Under 18 Femminile
 */

export type Girone = 'A' | 'B' | 'C' | 'D';

export type RoundType = 'QF' | 'SF' | 'F' | '3P';

export interface TeamStats {
  id: string;
  name: string;
  girone: Girone;
  PuntiCampionato: number;      // punti campionato
  GareGiocate: number;          // partite giocate
  GareVinte: number;            // partite vinte
  GarePerse: number;            // partite perse
  SetVinti: number;             // set vinti
  SetPersi: number;             // set persi
  QuozienteSet: number;         // quoziente set (calcolato)
  PuntiFatti: number;           // punti fatti
  PuntiSubiti: number;          // punti subiti
  QuozientePunti: number;       // quoziente punti (calcolato)
  QuozienteGare: number;        // quoziente gare (calcolato)
  caPosition?: number;          // posizione in classifica avulsa
}

export interface KnockoutMatch {
  id: string;
  round: RoundType;
  label: string;
  home: TeamStats | null;
  away: TeamStats | null;
  winnerId?: string;
  conflict?: boolean;
  date?: string;
}

export interface ApiTeamRaw {
  team_id?: number | string;
  disp?: string;
  sw?: number;          // set won
  sl?: number;          // set lost
  pw?: number;          // points won
  pl?: number;          // points lost
  points?: number;      // championship points
  gp?: number;          // games played
  w?: number;           // wins
  l?: number;           // losses
  [key: string]: any;   // per altri campi non previsti
}

export interface ApiResponse {
  ranks?: {
    seasons?: Array<{
      rank?: ApiTeamRaw[];
    }>;
  };
  data?: ApiTeamRaw[];
  result?: ApiTeamRaw[];
  classifica?: ApiTeamRaw[];
  teams?: ApiTeamRaw[];
  [key: string]: any;
}

export type AppStep = 1 | 2 | 3;

export interface AppState {
  teams: TeamStats[];
  loading: boolean;
  error: string | null;
  avulsa: TeamStats[];
  matches: KnockoutMatch[];
  currentStep: AppStep;
}