import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePreferences } from './usePreferences';
// import { useApp } from '../context/AppContext'; // Removed - no longer needed
import { useAccessibility } from './useAccessibility';

interface GlobalShortcuts {
  [key: string]: {
    keys: string[];
    description: string;
    action: () => void;
    category: string;
    enabled: boolean;
  };
}

export const useGlobalShortcuts = (onOpenSettings?: () => void) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { preferences } = usePreferences();
  // const { dispatch: appDispatch } = useApp(); // Removed - no longer needed
  const { announceToScreenReader, toggleHighContrast } = useAccessibility();

  // Global shortcuts configuration
  const shortcuts: GlobalShortcuts = {
    // Navigation
    'go-to-generator': {
      keys: ['ctrl', '1'],
      description: 'Go to JSON Generator',
      action: () => navigate('/'),
      category: 'Navigation',
      enabled: true
    },
    'go-to-validator': {
      keys: ['ctrl', '2'],
      description: 'Go to JSON Validator',
      action: () => navigate('/validator'),
      category: 'Navigation',
      enabled: true
    },
    'go-to-converter': {
      keys: ['ctrl', '3'],
      description: 'Go to CSV Converter',
      action: () => navigate('/converter'),
      category: 'Navigation',
      enabled: true
    },

    // Appearance (theme toggle removed - use UI button instead)
    'toggle-high-contrast': {
      keys: ['ctrl', 'shift', 'h'],
      description: 'Toggle High Contrast Mode',
      action: () => {
        toggleHighContrast();
      },
      category: 'Appearance',
      enabled: true
    },

    // General Actions
    'open-settings': {
      keys: ['ctrl', ','],
      description: 'Open Settings',
      action: () => {
        if (onOpenSettings) {
          onOpenSettings();
        }
      },
      category: 'General',
      enabled: true
    },
    'show-shortcuts': {
      keys: ['ctrl', 'alt', 'h'],
      description: 'Show Keyboard Shortcuts',
      action: () => {
        // Will be implemented with help system
        announceToScreenReader('Keyboard shortcuts help');
      },
      category: 'Help',
      enabled: true
    },

    // Tool-specific (work on current page)
    'copy-output': {
      keys: ['ctrl', 'alt', 'c'],
      description: 'Copy Output to Clipboard',
      action: () => {
        // This will be handled by individual tools
        const event = new CustomEvent('global-shortcut', { 
          detail: { action: 'copy-output' } 
        });
        window.dispatchEvent(event);
      },
      category: 'Tools',
      enabled: true
    },
    'save-file': {
      keys: ['ctrl', 'shift', 's'],
      description: 'Save/Download File',
      action: () => {
        const event = new CustomEvent('global-shortcut', { 
          detail: { action: 'save-file' } 
        });
        window.dispatchEvent(event);
      },
      category: 'Tools',
      enabled: true
    },
    'clear-input': {
      keys: ['ctrl', 'shift', 'k'],
      description: 'Clear Input/Reset',
      action: () => {
        const event = new CustomEvent('global-shortcut', { 
          detail: { action: 'clear-input' } 
        });
        window.dispatchEvent(event);
      },
      category: 'Tools',
      enabled: true
    },

    // JSON Generator specific
    'add-field': {
      keys: ['ctrl', 'enter'],
      description: 'Add New Field (JSON Generator)',
      action: () => {
        if (location.pathname === '/') {
          const event = new CustomEvent('global-shortcut', { 
            detail: { action: 'add-field' } 
          });
          window.dispatchEvent(event);
        }
      },
      category: 'JSON Generator',
      enabled: location.pathname === '/'
    },
    'toggle-compact': {
      keys: ['ctrl', 'd'],
      description: 'Toggle Compact Mode (JSON Generator)',
      action: () => {
        if (location.pathname === '/') {
          const event = new CustomEvent('global-shortcut', { 
            detail: { action: 'toggle-compact' } 
          });
          window.dispatchEvent(event);
        }
      },
      category: 'JSON Generator',
      enabled: location.pathname === '/'
    },

    // JSON Validator specific
    'format-json': {
      keys: ['ctrl', 'shift', 'f'],
      description: 'Format JSON (JSON Validator)',
      action: () => {
        if (location.pathname === '/validator') {
          const event = new CustomEvent('global-shortcut', { 
            detail: { action: 'format-json' } 
          });
          window.dispatchEvent(event);
        }
      },
      category: 'JSON Validator',
      enabled: location.pathname === '/validator'
    },
    'validate-json': {
      keys: ['ctrl', 'shift', 'v'],
      description: 'Validate JSON (JSON Validator)',
      action: () => {
        if (location.pathname === '/validator') {
          const event = new CustomEvent('global-shortcut', { 
            detail: { action: 'validate-json' } 
          });
          window.dispatchEvent(event);
        }
      },
      category: 'JSON Validator',
      enabled: location.pathname === '/validator'
    },

    // CSV Converter specific
    'convert-csv': {
      keys: ['ctrl', 'shift', 'c'],
      description: 'Convert CSV to JSON (CSV Converter)',
      action: () => {
        if (location.pathname === '/converter') {
          const event = new CustomEvent('global-shortcut', { 
            detail: { action: 'convert-csv' } 
          });
          window.dispatchEvent(event);
        }
      },
      category: 'CSV Converter',
      enabled: location.pathname === '/converter'
    },

    // Accessibility
    'focus-main': {
      keys: ['alt', 'm'],
      description: 'Focus Main Content',
      action: () => {
        const main = document.getElementById('main-content');
        if (main) {
          main.focus();
          announceToScreenReader('Focused main content');
        }
      },
      category: 'Accessibility',
      enabled: true
    },
    'focus-nav': {
      keys: ['alt', 'n'],
      description: 'Focus Navigation',
      action: () => {
        const nav = document.getElementById('main-navigation');
        if (nav) {
          nav.focus();
          announceToScreenReader('Focused navigation');
        }
      },
      category: 'Accessibility',
      enabled: true
    }
  };

  // Convert key combination to string for comparison
  const getKeyString = useCallback((keys: string[]): string => {
    return keys.map(k => k.toLowerCase()).sort().join('+');
  }, []);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't intercept shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      // Allow some shortcuts even in inputs
      const allowedInInputs = ['ctrl+shift+s', 'ctrl+alt+c', 'ctrl+,'];
      const pressed = [];
      
      if (event.ctrlKey) pressed.push('ctrl');
      if (event.shiftKey) pressed.push('shift');
      if (event.altKey) pressed.push('alt');
      if (event.metaKey) pressed.push('meta');
      pressed.push(event.key.toLowerCase());
      
      const keyString = pressed.sort().join('+');
      
      if (!allowedInInputs.includes(keyString)) {
        return;
      }
    }

    // Check if shortcuts are enabled
    if (!preferences.enableKeyboardShortcuts) {
      return;
    }

    // Build pressed keys array
    const pressedKeys = [];
    if (event.ctrlKey || event.metaKey) pressedKeys.push('ctrl');
    if (event.shiftKey) pressedKeys.push('shift');
    if (event.altKey) pressedKeys.push('alt');
    
    // Add the main key
    const mainKey = event.key.toLowerCase();
    if (mainKey !== 'control' && mainKey !== 'shift' && mainKey !== 'alt' && mainKey !== 'meta') {
      pressedKeys.push(mainKey);
    }

    const pressedKeyString = getKeyString(pressedKeys);

    // Find matching shortcut
    for (const [id, shortcut] of Object.entries(shortcuts)) {
      if (!shortcut.enabled) continue;
      
      const shortcutKeyString = getKeyString(shortcut.keys);
      if (pressedKeyString === shortcutKeyString) {
        event.preventDefault();
        event.stopPropagation();
        
        try {
          shortcut.action();
          announceToScreenReader(`Executed ${shortcut.description}`);
        } catch (error) {
          console.error(`Error executing shortcut ${id}:`, error);
        }
        break;
      }
    }
  }, [preferences.enableKeyboardShortcuts, getKeyString, shortcuts, announceToScreenReader]);

  // Register global keyboard listener
  useEffect(() => {
    if (preferences.enableKeyboardShortcuts) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, preferences.enableKeyboardShortcuts]);

  // Get shortcuts organized by category
  const getShortcutsByCategory = useCallback(() => {
    const categories: { [category: string]: typeof shortcuts } = {};
    
    Object.entries(shortcuts).forEach(([id, shortcut]) => {
      if (!categories[shortcut.category]) {
        categories[shortcut.category] = {};
      }
      categories[shortcut.category][id] = shortcut;
    });
    
    return categories;
  }, [shortcuts]);

  // Get shortcut by ID
  const getShortcut = useCallback((id: string) => {
    return shortcuts[id];
  }, [shortcuts]);

  // Format keys for display
  const formatKeys = useCallback((keys: string[]): string => {
    const keyMap: { [key: string]: string } = {
      'ctrl': '⌘',
      'shift': '⇧',
      'alt': '⌥',
      'meta': '⌘',
      'enter': '↵',
      'tab': '⇥',
      'escape': 'Esc',
      ',': ',',
      '/': '/',
      '?': '?'
    };
    
    return keys.map(key => keyMap[key.toLowerCase()] || key.toUpperCase()).join(' + ');
  }, []);

  return {
    shortcuts,
    getShortcutsByCategory,
    getShortcut,
    formatKeys,
    isEnabled: preferences.enableKeyboardShortcuts
  };
};