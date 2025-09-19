import { createContext } from 'react';
import { UserPreferences } from './PreferencesContext';

export interface PreferencesContextType {
  preferences: UserPreferences;
  setPreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  togglePreference: (key: keyof UserPreferences) => void;
  resetPreferences: () => void;
  exportPreferences: () => string;
  importPreferences: (data: string) => boolean;
  completeTour: (tourId: string) => void;
  isFirstVisit: boolean;
}

export const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);