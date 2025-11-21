/**
 * Servizio per il caricamento dei dati dall'API MatchShare
 */
import type { TeamStats, ApiTeamRaw, ApiResponse } from '../types';
import { SID_TO_GIRONE, SIDS, CLASSIFICA_URLS } from '../constants';
import { mapApiToTeamStats } from '../utils/teamUtils';

interface LoadResult {
  teams: TeamStats[];
  errors: string[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Estrae i team raw dalla risposta JSON dell'API
 */
function extractTeamsFromResponse(payload: unknown): ApiTeamRaw[] {
  if (Array.isArray(payload)) return payload as ApiTeamRaw[];
  if (!isObject(payload)) return [];

  const json = payload as ApiResponse;

  // Prova il percorso corretto: ranks.seasons[0].rank
  if (json.ranks?.seasons && Array.isArray(json.ranks.seasons) && json.ranks.seasons.length > 0) {
    const firstSeason = json.ranks.seasons[0];
    if (firstSeason?.rank && Array.isArray(firstSeason.rank)) {
      return firstSeason.rank;
    }
  }

  // Fallback per altre strutture
  if (Array.isArray(json)) return json;
  if (json.data && Array.isArray(json.data)) return json.data;
  if (json.result && Array.isArray(json.result)) return json.result;
  if (json.classifica && Array.isArray(json.classifica)) return json.classifica;
  if (json.teams && Array.isArray(json.teams)) return json.teams;

  return [];
}

/**
 * Carica i dati da un singolo girone
 */
async function loadGironeData(sid: number): Promise<{ teams: TeamStats[]; error: string | null }> {
  const urls = CLASSIFICA_URLS(sid);
  const girone = SID_TO_GIRONE[sid];
  let lastError = '';

  // Prova entrambi gli endpoint
  for (const url of urls) {
    try {
      console.log(`🔄 Tentativo fetch per girone ${girone}:`, url);
      
      const res = await fetch(url);
      const text = await res.text();
      
      console.log(`📡 Status ${girone}: ${res.status}`, {
        contentType: res.headers.get('content-type'),
        previewLength: text.length,
      });

      if (!res.ok) {
        lastError = `HTTP ${res.status} - ${res.statusText}`;
        console.warn(`⚠️ Girone ${girone}: ${lastError}`);
        continue;
      }

      // Verifica se la risposta è HTML (errore comune)
      if (text.trim().startsWith('<')) {
        lastError = 'Risposta HTML invece di JSON';
        console.warn(`⚠️ Girone ${girone}: ${lastError}`);
        continue;
      }

      // Parse JSON
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch (parseErr) {
        lastError = 'Risposta non JSON valida';
        console.warn(`⚠️ Girone ${girone}: ${lastError}`, parseErr);
        continue;
      }

      // Estrai i team
      const rawTeams = extractTeamsFromResponse(json);
      
      if (rawTeams.length === 0) {
        lastError = 'Nessuna squadra trovata nella risposta';
        console.warn(`⚠️ Girone ${girone}: ${lastError}`);
        continue;
      }

      console.log(`✅ Girone ${girone}: ${rawTeams.length} squadre caricate`);

      // Mappa i team
      const teams = rawTeams.map((rt) => mapApiToTeamStats(rt, girone));
      
      return { teams, error: null };
    } catch (e: unknown) {
      lastError = e instanceof Error ? e.message : 'Errore sconosciuto';
      console.error(`❌ Errore girone ${girone} con URL ${url}:`, e);
    }
  }

  return { teams: [], error: lastError };
}

/**
 * Carica i dati da tutti i gironi
 */
export async function loadAllGironiData(): Promise<LoadResult> {
  const allTeams: TeamStats[] = [];
  const errors: string[] = [];

  for (const sid of SIDS) {
    const girone = SID_TO_GIRONE[sid];
    const { teams, error } = await loadGironeData(sid);

    if (error) {
      errors.push(`${girone}: ${error}`);
    } else {
      allTeams.push(...teams);
    }
  }

  return { teams: allTeams, errors };
}

/**
 * Formatta gli errori per la visualizzazione
 */
export function formatLoadErrors(errors: string[], totalTeams: number): string {
  if (errors.length === 0) return '';

  const errorList = errors.map((e) => `• ${e}`).join('\n');
  
  if (totalTeams === 0) {
    return `❌ Impossibile caricare dati da nessun girone.\n\nErrori:\n${errorList}\n\n` +
      `Possibili cause:\n` +
      `• API richiede autenticazione\n` +
      `• CORS bloccato dal browser\n` +
      `• Endpoint cambiati\n` +
      `• Problema di rete\n\n` +
      `💡 Soluzione: Usa "Carica Dati di Esempio" per testare l'app.`;
  }

  return `⚠️ Caricati solo ${totalTeams} squadre.\n\nErrori per:\n${errorList}`;
}
