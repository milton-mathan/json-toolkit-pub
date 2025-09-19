import React, { useReducer, useEffect, useState } from 'react';
import { PreferencesContext } from './PreferencesContextDefinition';

// User preference types
export interface UserPreferences {
  // Appearance
  theme: 'light' | 'dark' | 'auto';
  highContrastMode: boolean;
  reducedMotion: boolean;
  compactMode: boolean;
  
  // Layout
  layout: 'default' | 'compact' | 'wide';
  sidebarCollapsed: boolean;
  panelLayout: 'horizontal' | 'vertical';
  
  // Editor preferences
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  fontFamily: 'mono' | 'sans' | 'serif';
  lineHeight: 'tight' | 'normal' | 'relaxed';
  wordWrap: boolean;
  
  // JSON preferences
  indentSize: 2 | 4 | 8;
  autoFormat: boolean;
  syntaxHighlight: boolean;
  validateOnType: boolean;
  
  // CSV preferences
  defaultDelimiter: ',' | ';' | '\t' | '|';
  hasHeader: boolean;
  autoDetectDelimiter: boolean;
  
  // Keyboard shortcuts
  enableKeyboardShortcuts: boolean;
  shortcutScheme: 'default' | 'vim' | 'emacs';
  
  // Help & Onboarding
  showTooltips: boolean;
  showOnboarding: boolean;
  tourCompleted: string[];
  
  // Performance
  enableAnimations: boolean;
  lazyLoading: boolean;
  preloadNext: boolean;
}

const defaultPreferences: UserPreferences = {
  // Appearance
  theme: 'auto',
  highContrastMode: false,
  reducedMotion: false,
  compactMode: false,
  
  // Layout
  layout: 'default',
  sidebarCollapsed: false,
  panelLayout: 'horizontal',
  
  // Editor preferences
  fontSize: 'base',
  fontFamily: 'mono',
  lineHeight: 'normal',
  wordWrap: true,
  
  // JSON preferences
  indentSize: 2,
  autoFormat: true,
  syntaxHighlight: true,
  validateOnType: true,
  
  // CSV preferences
  defaultDelimiter: ',',
  hasHeader: true,
  autoDetectDelimiter: true,
  
  // Keyboard shortcuts
  enableKeyboardShortcuts: true,
  shortcutScheme: 'default',
  
  // Help & Onboarding
  showTooltips: true,
  showOnboarding: true,
  tourCompleted: [],
  
  // Performance
  enableAnimations: true,
  lazyLoading: true,
  preloadNext: true,
};

// Actions
type PreferencesAction =
  | { type: 'SET_PREFERENCE'; key: keyof UserPreferences; value: UserPreferences[keyof UserPreferences] }
  | { type: 'RESET_PREFERENCES' }
  | { type: 'IMPORT_PREFERENCES'; preferences: Partial<UserPreferences> }
  | { type: 'COMPLETE_TOUR'; tourId: string }
  | { type: 'TOGGLE_PREFERENCE'; key: keyof UserPreferences };

// Reducer
const preferencesReducer = (state: UserPreferences, action: PreferencesAction): UserPreferences => {
  switch (action.type) {
    case 'SET_PREFERENCE':
      return { ...state, [action.key]: action.value };
    
    case 'TOGGLE_PREFERENCE':
      return { ...state, [action.key]: !state[action.key] };
    
    case 'COMPLETE_TOUR':
      return {
        ...state,
        tourCompleted: [...state.tourCompleted, action.tourId]
      };
    
    case 'RESET_PREFERENCES':
      return { ...defaultPreferences };
    
    case 'IMPORT_PREFERENCES':
      return { ...state, ...action.preferences };
    
    default:
      return state;
  }
};

// Context

// Provider component
interface PreferencesProviderProps {
  children: React.ReactNode;
}

export const PreferencesProvider: React.FC<PreferencesProviderProps> = ({ children }) => {
  const [preferences, dispatch] = useReducer(preferencesReducer, defaultPreferences);
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('json-toolkit-preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'IMPORT_PREFERENCES', preferences: parsed });
        setIsFirstVisit(false);
      } else {
        // Check if user has visited before
        const hasVisited = localStorage.getItem('json-toolkit-visited');
        if (hasVisited) {
          setIsFirstVisit(false);
        } else {
          localStorage.setItem('json-toolkit-visited', 'true');
        }
      }
    } catch (error) {
      console.warn('Failed to load preferences:', error);
    }
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('json-toolkit-preferences', JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save preferences:', error);
    }
  }, [preferences]);

  // Apply theme changes
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      
      if (preferences.theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      } else {
        root.classList.toggle('dark', preferences.theme === 'dark');
      }
    };

    applyTheme();

    // Listen for system theme changes if auto theme is selected
    if (preferences.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [preferences.theme]);

  // Apply other visual preferences
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast mode
    root.classList.toggle('high-contrast', preferences.highContrastMode);
    
    // Compact mode
    root.classList.toggle('compact-mode', preferences.compactMode);
    
    // Font size
    root.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');
    root.classList.add(`text-${preferences.fontSize}`);
    
    // Layout
    root.classList.remove('layout-default', 'layout-compact', 'layout-wide');
    root.classList.add(`layout-${preferences.layout}`);
  }, [
    preferences.highContrastMode,
    preferences.compactMode,
    preferences.fontSize,
    preferences.layout
  ]);

  const setPreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    dispatch({ type: 'SET_PREFERENCE', key, value });
  };

  const togglePreference = (key: keyof UserPreferences) => {
    dispatch({ type: 'TOGGLE_PREFERENCE', key });
  };

  const resetPreferences = () => {
    dispatch({ type: 'RESET_PREFERENCES' });
  };

  const exportPreferences = () => {
    return JSON.stringify(preferences, null, 2);
  };

  const importPreferences = (json: string): boolean => {
    try {
      const parsed = JSON.parse(json);
      dispatch({ type: 'IMPORT_PREFERENCES', preferences: parsed });
      return true;
    } catch (error) {
      console.error('Failed to import preferences:', error);
      return false;
    }
  };

  const completeTour = (tourId: string) => {
    dispatch({ type: 'COMPLETE_TOUR', tourId });
  };

  const value = {
    preferences,
    setPreference,
    togglePreference,
    resetPreferences,
    exportPreferences,
    importPreferences,
    completeTour,
    isFirstVisit
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export default PreferencesProvider;