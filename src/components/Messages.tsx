/**
 * Componenti per messaggi di stato
 */

import React from 'react';

interface MessageProps {
  children: React.ReactNode;
}

export const ErrorMessage: React.FC<MessageProps> = ({ children }) => {
  return (
    <div className="error-message">
      <strong>⚠️ Errore:</strong>
      <div style={{ marginTop: '0.5rem' }}>{children}</div>
    </div>
  );
};

export const SuccessMessage: React.FC<MessageProps> = ({ children }) => {
  return (
    <div className="success-message">
      {children}
    </div>
  );
};

export const WarningMessage: React.FC<MessageProps> = ({ children }) => {
  return (
    <div className="warning-message">
      <strong>⚠️ Attenzione:</strong> {children}
    </div>
  );
};

export const InfoBox: React.FC<MessageProps> = ({ children }) => {
  return (
    <div className="info-box">
      {children}
    </div>
  );
};
