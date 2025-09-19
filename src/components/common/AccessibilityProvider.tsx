import React, { useEffect, useState } from 'react';
import { useAnnouncer } from '../../hooks/useKeyboardNavigation';
import { AccessibilityContext } from '../../context/AccessibilityContext';

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const { announce } = useAnnouncer();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [focusVisible, setFocusVisible] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Load high contrast preference
    const saved = localStorage.getItem('high-contrast-mode');
    if (saved === 'true') {
      setHighContrastMode(true);
      document.documentElement.classList.add('high-contrast');
    }
  }, []);

  useEffect(() => {
    // Focus visible detection
    let hadKeyboardEvent = false;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        hadKeyboardEvent = true;
        setFocusVisible(true);
      }
    };

    const onMouseDown = () => {
      hadKeyboardEvent = false;
      setFocusVisible(false);
    };

    const onFocus = () => {
      if (hadKeyboardEvent) {
        setFocusVisible(true);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('focusin', onFocus);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('focusin', onFocus);
    };
  }, []);

  const toggleHighContrast = () => {
    const newValue = !highContrastMode;
    setHighContrastMode(newValue);
    localStorage.setItem('high-contrast-mode', newValue.toString());
    
    if (newValue) {
      document.documentElement.classList.add('high-contrast');
      announce('High contrast mode enabled');
    } else {
      document.documentElement.classList.remove('high-contrast');
      announce('High contrast mode disabled');
    }
  };

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announce(message, priority);
  };

  const value = {
    announceToScreenReader,
    prefersReducedMotion,
    highContrastMode,
    focusVisible,
    toggleHighContrast
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Skip Links Component
export const SkipLinks: React.FC = () => {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="absolute top-4 left-4 z-50 px-4 py-2 bg-blue-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <a
        href="#main-navigation"
        className="absolute top-4 left-32 z-50 px-4 py-2 bg-blue-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Skip to navigation
      </a>
    </div>
  );
};

// Screen Reader Only component
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <span className="sr-only">{children}</span>;
};

// Focus indicator component
export const FocusRing: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  visible?: boolean;
}> = ({ children, className = '', visible }) => {
  const { focusVisible } = { focusVisible: visible ?? false };
  
  return (
    <div 
      className={`
        ${className} 
        ${(visible ?? focusVisible) ? 'ring-2 ring-blue-500 ring-offset-2' : ''} 
        transition-all duration-150
      `}
    >
      {children}
    </div>
  );
};