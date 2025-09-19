// src/context/AppContext.tsx
import React, { useReducer, ReactNode } from 'react';
import { AppState, AppAction } from '../types';
import { AppContext } from './AppContextDefinition';

// Initial state
const initialState: AppState = {
  currentTool: 'json-generator',
  theme: 'light',
  isLoading: false,
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_CURRENT_TOOL':
      return { ...state, currentTool: action.payload };
    case 'TOGGLE_THEME': {
      //return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      return { ...state, theme: newTheme };
    }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};