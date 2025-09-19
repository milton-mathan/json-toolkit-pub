import React, { useState } from 'react';
import { usePreferences } from '../../hooks/usePreferences';
import { useFocusManagement } from '../../hooks/useKeyboardNavigation';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { 
    preferences, 
    setPreference, 
    togglePreference, 
    resetPreferences,
    exportPreferences,
    importPreferences
  } = usePreferences();
  
  const { trapFocus } = useFocusManagement();
  const [activeTab, setActiveTab] = useState('appearance');
  const [importData, setImportData] = useState('');
  const modalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && modalRef.current) {
      const cleanup = trapFocus(modalRef.current);
      return cleanup;
    }
  }, [isOpen, trapFocus]);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'layout', label: 'Layout', icon: '🏗️' },
    { id: 'editor', label: 'Editor', icon: '📝' },
    { id: 'tools', label: 'Tools', icon: '🔧' },
    { id: 'shortcuts', label: 'Shortcuts', icon: '⌨️' },
    { id: 'help', label: 'Help', icon: '❓' },
    { id: 'advanced', label: 'Advanced', icon: '⚙️' }
  ];

  const handleImportPreferences = () => {
    if (importPreferences(importData)) {
      setImportData('');
      alert('Preferences imported successfully!');
    } else {
      alert('Failed to import preferences. Please check the format.');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 id="settings-title" className="text-xl font-semibold text-gray-900 dark:text-white">
            Settings & Preferences
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <nav className="w-48 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
            <div className="p-4 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Appearance Settings</h3>
                
                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Theme
                  </label>
                  <select
                    value={preferences.theme}
                    onChange={(e) => setPreference('theme', e.target.value as 'light' | 'dark' | 'auto')}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>

                {/* High Contrast */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      High Contrast Mode
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Increases contrast for better readability
                    </p>
                  </div>
                  <button
                    onClick={() => togglePreference('highContrastMode')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.highContrastMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.highContrastMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Compact Mode */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Compact Mode
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Reduces spacing for more content on screen
                    </p>
                  </div>
                  <button
                    onClick={() => togglePreference('compactMode')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.compactMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.compactMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Font Size
                  </label>
                  <select
                    value={preferences.fontSize}
                    onChange={(e) => setPreference('fontSize', e.target.value as 'sm' | 'base' | 'lg' | 'xl')}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="sm">Small</option>
                    <option value="base">Medium</option>
                    <option value="lg">Large</option>
                    <option value="xl">Extra Large</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'layout' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Layout Settings</h3>
                
                {/* Layout Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Layout Type
                  </label>
                  <select
                    value={preferences.layout}
                    onChange={(e) => setPreference('layout', e.target.value as 'default' | 'compact' | 'wide')}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="default">Default</option>
                    <option value="compact">Compact</option>
                    <option value="wide">Wide</option>
                  </select>
                </div>

                {/* Panel Layout */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Panel Layout
                  </label>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setPreference('panelLayout', 'horizontal')}
                      className={`flex-1 p-3 border rounded-md text-center transition-colors ${
                        preferences.panelLayout === 'horizontal'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="text-sm font-medium">Horizontal</div>
                      <div className="text-xs text-gray-500">Side by side</div>
                    </button>
                    <button
                      onClick={() => setPreference('panelLayout', 'vertical')}
                      className={`flex-1 p-3 border rounded-md text-center transition-colors ${
                        preferences.panelLayout === 'vertical'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="text-sm font-medium">Vertical</div>
                      <div className="text-xs text-gray-500">Stacked</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Keyboard Shortcuts</h3>
                
                {/* Enable Shortcuts */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Enable Keyboard Shortcuts
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Enable global keyboard shortcuts for faster navigation
                    </p>
                  </div>
                  <button
                    onClick={() => togglePreference('enableKeyboardShortcuts')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.enableKeyboardShortcuts ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.enableKeyboardShortcuts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Shortcut Reference */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Available Shortcuts</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Add Field</span>
                      <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">Ctrl+Enter</code>
                    </div>
                    <div className="flex justify-between">
                      <span>Copy JSON</span>
                      <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">Ctrl+C</code>
                    </div>
                    <div className="flex justify-between">
                      <span>Download JSON</span>
                      <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">Ctrl+S</code>
                    </div>
                    <div className="flex justify-between">
                      <span>Toggle Theme</span>
                      <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">Ctrl+Shift+T</code>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Advanced Settings</h3>
                
                {/* Export Preferences */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Export Preferences
                  </label>
                  <button
                    onClick={() => {
                      const data = exportPreferences();
                      navigator.clipboard.writeText(data);
                      alert('Preferences copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Copy to Clipboard
                  </button>
                </div>

                {/* Import Preferences */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Import Preferences
                  </label>
                  <textarea
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    placeholder="Paste preferences JSON here..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    rows={4}
                  />
                  <button
                    onClick={handleImportPreferences}
                    disabled={!importData.trim()}
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Import Settings
                  </button>
                </div>

                {/* Reset Preferences */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reset to Defaults
                  </label>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to reset all preferences to default values?')) {
                        resetPreferences();
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Reset All Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;