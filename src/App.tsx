/**
 * Applicazione principale - Simulatore Fasi Finali Under 18 Femminile
 * FIPAV Bergamo 2025/2026
 */

import React, { useState } from 'react';
import './App.css';

// Types
// Types
import type { TeamStats, AppStep, KnockoutMatch } from './types';

// Services
import { loadAllGironiData, formatLoadErrors } from './services/apiService';

// Utils
import {
  groupTeamsByGirone,
  recalculateQuotients,
  calculateAvulsa,
  generateBracket,
} from './utils';

// Components
import {
  AppHeader,
  AppFooter,
  Step1LoadData,
  Step2EditData,
  Step3Results,
} from './components';

const App: React.FC = () => {
  // State
  const [teams, setTeams] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avulsa, setAvulsa] = useState<TeamStats[]>([]);
  const [matches, setMatches] = useState<KnockoutMatch[]>([]);
  const [currentStep, setCurrentStep] = useState<AppStep>(1);

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

  // Computed values
  const teamsByGirone = groupTeamsByGirone(teams);
  const gironiCount = new Set(teams.map((t) => t.girone)).size;

  return (
    <div className="app-container">
      <AppHeader />

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
        onComputeAvulsa={handleComputeAvulsaAndBracket}
        isActive={currentStep >= 2}
      />

      {/* Step 3: Risultati */}
      <Step3Results
        avulsa={avulsa}
        matches={matches}
        isActive={currentStep >= 3}
      />

      <AppFooter />
    </div>
  );
};

export default App;
