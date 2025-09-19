import { useContext } from 'react';
import { PreferencesContext } from '../context/PreferencesContextDefinition';

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
};