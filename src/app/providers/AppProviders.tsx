import React, { useEffect } from 'react';
import { AuthProvider } from '../../features/auth/AuthContext';
import { ToastContainer } from '../../components/feedback/ToastContainer';
import { settingsRepository } from '../../services/repositories';
import { applyThemeColors } from '../../utils/theme';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Bootstrap campaign colors from persistent settings
    settingsRepository.getSettings().then(settings => {
      if (settings) {
        applyThemeColors(settings);
      }
    }).catch(console.error);
  }, []);

  return (
    <AuthProvider>
      {children}
      <ToastContainer />
    </AuthProvider>
  );
};
