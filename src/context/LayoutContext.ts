import { createContext } from 'react';

export interface LayoutContextType {
  layout: 'default' | 'compact' | 'wide';
  panelLayout: 'horizontal' | 'vertical';
  compactMode: boolean;
  getContainerClass: () => string;
  getPanelClass: () => string;
  getCardClass: () => string;
  getSpacingClass: () => string;
}

export const LayoutContext = createContext<LayoutContextType | undefined>(undefined);