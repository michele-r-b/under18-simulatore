/**
 * Applicazione principale - Simulatore Fasi Finali Under 18 Femminile
 * FIPAV Bergamo 2025/2026
 */

import React, { useEffect, useState } from 'react';
import './App.css';

// Types
// Types
import type { TeamStats, AppStep, KnockoutMatch, Girone } from './types';

// Services
import { loadAllGironiData, formatLoadErrors } from './services/apiService';

// Utils
import {
  groupTeamsByGirone,
  recalculateQuotients,
  calculateAvulsa,
  generateBracket,
  applyMatchResult,
} from './utils';

// Components
import {
  AppFooter,
  Step1LoadData,
  Step2EditData,
  Step3Results,
  Login,
} from './components';

const App: React.FC = () => {
  // State
  const [teams, setTeams] = useState<TeamStats[]>([]);
  const [originalTeams, setOriginalTeams] = useState<TeamStats[]>([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avulsa, setAvulsa] = useState<TeamStats[]>([]);
  const [matches, setMatches] = useState<KnockoutMatch[]>([]);
  const [currentStep, setCurrentStep] = useState<AppStep>(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

 // Controlla se l'utente è già loggato
  useEffect(() => {
    const auth = sessionStorage.getItem('auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    if (window.confirm('Vuoi davvero uscire?')) {
      sessionStorage.removeItem('auth');
      setIsAuthenticated(false);
      // Reset dati
      setTeams([]);
      setOriginalTeams([]);
      setAvulsa([]);
      setMatches([]);
      setCurrentStep(1);
    }
  };

  // Handlers
  const handleLoadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { teams: loadedTeams, errors } = await loadAllGironiData();

      if (loadedTeams.length === 0) {
        throw new Error(formatLoadErrors(errors, 0));
      }

      setTeams(loadedTeams);
      setOriginalTeams(loadedTeams);  // ← AGGIUNTO: salva l'originale
      setAvulsa([]);
      setMatches([]);
      setCurrentStep(2);

      if (errors.length > 0) {
        setError(formatLoadErrors(errors, loadedTeams.length));
      } else {
        setError(null);
      }
    } catch (e: unknown) {
      console.error('❌ Errore generale nel caricamento:', e);
      const message = e instanceof Error ? e.message : 'Errore nel caricamento dei dati';
      setError(message);
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
        return recalculateQuotients(t, field, value);
      })
    );
  };

const handleAddMatch = (
    girone: string,
    homeTeamId: string,
    awayTeamId: string,
    result: '3-0' | '3-1' | '3-2' | '0-3' | '1-3' | '2-3'
  ) => {
    setTeams((prev) => applyMatchResult(prev, homeTeamId, awayTeamId, result));
  };

 const handleResetGirone = (targetGirone: Girone) => {
    setTeams((prev) => {
      // Filtra le squadre del girone da ripristinare
      const originalGironeTeams = originalTeams.filter((t) => t.girone === targetGirone);
      // Mantieni le altre squadre, sostituisci quelle del girone
      return prev.map((team) => {
        if (team.girone === targetGirone) {
          const original = originalGironeTeams.find((t) => t.id === team.id);
          return original || team;
        }
        return team;
      });
    });
  };

  const handleComputeAvulsaAndBracket = () => {
    if (teams.length === 0) {
      setError('Nessuna squadra caricata');
      return;
    }

    try {
      // Calcola classifica avulsa
      const avulsaSorted = calculateAvulsa(teams);
      setAvulsa(avulsaSorted);

      if (avulsaSorted.length !== 8) {
        setError('Numero di squadre qualificate non valido');
        setMatches([]);
        return;
      }

      // Genera tabellone
      const bracket = generateBracket(avulsaSorted);
      if (!bracket) {
        setError('Impossibile generare gli accoppiamenti');
        return;
      }

      setMatches(bracket);
      setCurrentStep(3);
      setError(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Errore nel calcolo';
      setError(message);
    }
  };

const handleSelectWinner = (matchId: string, winnerId: string) => {
    setMatches((prevMatches) => {
      const updatedMatches = prevMatches.map((m) =>
        m.id === matchId ? { ...m, winnerId } : m
      );

      // Propaga i vincitori alle fasi successive
      return propagateWinners(updatedMatches);
    });
  };

  const propagateWinners = (matches: KnockoutMatch[]): KnockoutMatch[] => {
    const updated = [...matches];

    // QF1 winner → SF1 home
    const qf1 = updated.find((m) => m.id === 'QF1');
    const sf1 = updated.find((m) => m.id === 'SF1');
    if (qf1?.winnerId && sf1) {
      const winner = qf1.home?.id === qf1.winnerId ? qf1.home : qf1.away;
      sf1.home = winner;
    }

    // QF4 winner → SF1 away
    const qf4 = updated.find((m) => m.id === 'QF4');
    if (qf4?.winnerId && sf1) {
      const winner = qf4.home?.id === qf4.winnerId ? qf4.home : qf4.away;
      sf1.away = winner;
    }

    // QF2 winner → SF2 home
    const qf2 = updated.find((m) => m.id === 'QF2');
    const sf2 = updated.find((m) => m.id === 'SF2');
    if (qf2?.winnerId && sf2) {
      const winner = qf2.home?.id === qf2.winnerId ? qf2.home : qf2.away;
      sf2.home = winner;
    }

    // QF3 winner → SF2 away
    const qf3 = updated.find((m) => m.id === 'QF3');
    if (qf3?.winnerId && sf2) {
      const winner = qf3.home?.id === qf3.winnerId ? qf3.home : qf3.away;
      sf2.away = winner;
    }

    // SF1 winner → Finale
    const finale = updated.find((m) => m.id === 'F1');
    if (sf1?.winnerId && finale) {
      const winner = sf1.home?.id === sf1.winnerId ? sf1.home : sf1.away;
      finale.home = winner;
    }

    // SF2 winner → Finale
    if (sf2?.winnerId && finale) {
      const winner = sf2.home?.id === sf2.winnerId ? sf2.home : sf2.away;
      finale.away = winner;
    }

    // SF losers → 3P
    const bronze = updated.find((m) => m.id === 'F3P');
    if (sf1?.winnerId && bronze) {
      const loser = sf1.home?.id === sf1.winnerId ? sf1.away : sf1.home;
      bronze.home = loser;
    }
    if (sf2?.winnerId && bronze) {
      const loser = sf2.home?.id === sf2.winnerId ? sf2.away : sf2.home;
      bronze.away = loser;
    }

    return updated;
  };

  // Computed values
  const teamsByGirone = groupTeamsByGirone(teams);
  const gironiCount = new Set(teams.map((t) => t.girone)).size;

  // Mostra login se non autenticato
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>🏐 Simulatore Fasi Finali</h1>
            <p className="subtitle">Under 18 Femminile - FIPAV Bergamo 2025/2026</p>
          </div>
          <button onClick={handleLogout} className="logout-button">
            🚪 Esci
          </button>
        </div>
      </header>

      {/* Step 1: Caricamento Dati */}
      <Step1LoadData
        loading={loading}
        error={error}
        teamsCount={teams.length}
        gironiCount={gironiCount}
        onLoadData={() => {
          void handleLoadData();
        }}
        isActive={currentStep >= 1}
      />

      {/* Step 2: Modifica Dati */}
    <Step2EditData
        teams={teams}
        teamsByGirone={teamsByGirone}
        onUpdateField={handleUpdateTeamField}
        onAddMatch={handleAddMatch}
        onResetGirone={handleResetGirone}
        onComputeAvulsa={handleComputeAvulsaAndBracket}
        isActive={currentStep >= 2}
      />

      {/* Step 3: Risultati */}
      <Step3Results
        avulsa={avulsa}
        matches={matches}
        onSelectWinner={handleSelectWinner}
        isActive={currentStep >= 3}
      />

      <AppFooter />
    </div>
  );
};

export default App;
