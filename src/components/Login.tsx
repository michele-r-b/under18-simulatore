/**
 * Componente Login
 */

import React, { useState } from 'react';
import '../Login.css';

interface LoginProps {
  onLogin: () => void;
}

// Hash SHA-256 della password "Under18F"

const PASSWORD_HASH = 'c8016b0f641639abdf31b64e6d651d31cff9d8f696b596fce3f74b291c34be17';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    if (username !== 'Volley') {
      setError('Credenziali non valide');
      setLoading(false);
      return;
    }

    const hashedPassword = await hashPassword(password);
    
    if (hashedPassword === PASSWORD_HASH) {
      sessionStorage.setItem('auth', 'true');
      onLogin();
    } else {
      setError('Credenziali non valide');
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="login-icon">🏐</div>
          <h1>Simulatore Fasi Finali</h1>
          <p className="login-subtitle">Under 18 Femminile - FIPAV Bergamo</p>
          <p className="login-season">Campionato 2025/2026</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Inserisci username"
              required
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Inserisci password"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="login-error">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? '⏳ Accesso in corso...' : '🔓 Accedi'}
          </button>
        </form>

        <div className="login-footer">
          <p>🔒 Accesso riservato agli operatori FIPAV Bergamo</p>
        </div>
      </div>
    </div>
  );
};