import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

export const useKeyboardNavigation = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const matchingShortcut = shortcuts.find(shortcut => {
      return shortcut.key.toLowerCase() === event.key.toLowerCase() &&
             !!shortcut.ctrlKey === event.ctrlKey &&
             !!shortcut.shiftKey === event.shiftKey &&
             !!shortcut.altKey === event.altKey &&
             !!shortcut.metaKey === event.metaKey;
    });

    if (matchingShortcut) {
      if (matchingShortcut.preventDefault !== false) {
        event.preventDefault();
      }
      matchingShortcut.action();
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return shortcuts;
};

// Skip link navigation for screen readers
export const useSkipLinks = () => {
  const skipToMain = useCallback(() => {
    const mainElement = document.getElementById('main-content');
    if (mainElement) {
      mainElement.focus();
      mainElement.scrollIntoView();
    }
  }, []);

  const skipToNav = useCallback(() => {
    const navElement = document.getElementById('main-navigation');
    if (navElement) {
      navElement.focus();
      navElement.scrollIntoView();
    }
  }, []);

  return { skipToMain, skipToNav };
};

// Focus management utilities
export const useFocusManagement = () => {
  const trapFocus = useCallback((containerElement: HTMLElement) => {
    const focusableElements = containerElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            e.preventDefault();
          }
        }
      }
    };

    containerElement.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    if (firstFocusable) {
      firstFocusable.focus();
    }

    return () => {
      containerElement.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  const restoreFocus = useCallback((elementToFocus?: HTMLElement | null) => {
    if (elementToFocus && elementToFocus.focus) {
      elementToFocus.focus();
    }
  }, []);

  return { trapFocus, restoreFocus };
};

// Announce changes to screen readers
export const useAnnouncer = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.setAttribute('class', 'sr-only');
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }, []);

  return { announce };
};

export default useKeyboardNavigation;