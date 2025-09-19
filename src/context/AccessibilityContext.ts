import { createContext } from 'react';

export interface AccessibilityContextType {
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  prefersReducedMotion: boolean;
  highContrastMode: boolean;
  focusVisible: boolean;
  toggleHighContrast: () => void;
}

export const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);