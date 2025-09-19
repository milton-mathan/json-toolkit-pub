// src/App.tsx
import React, { Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AccessibilityProvider, SkipLinks } from './components/common/AccessibilityProvider';
import { PreferencesProvider } from './context/PreferencesContext';
import { LayoutProvider } from './components/common/LayoutProvider';
import Header from './components/common/Header';
import Navigation from './components/common/Navigation';
import Container from './components/common/Container';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import SettingsModal from './components/common/SettingsModal';
import OnboardingTour from './components/common/OnboardingTour';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';

// Lazy load main components for code splitting
const JSONGenerator = React.lazy(() => import('./components/json-generator/JSONGenerator'));
const JSONValidator = React.lazy(() => import('./components/json-validator/JSONValidator'));
const CSVConverter = React.lazy(() => import('./components/csv-converter/CSVConverter'));
const XMLConverter = React.lazy(() => import('./components/xml-converter/XMLConverter'));

// App content component to use hooks
const AppContent: React.FC = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Initialize global shortcuts
  useGlobalShortcuts(() => setSettingsOpen(true));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <SkipLinks />
      <ErrorBoundary>
        <Header />
        <Navigation />
        <Container>
          <main 
            id="main-content" 
            tabIndex={-1}
            className="focus:outline-none"
            role="main"
            aria-label="Main content"
            data-tour="main-content"
          >
            <Suspense fallback={
              <LoadingSpinner 
                size="lg" 
                text="Loading application..." 
                className="py-16"
              />
            }>
              <Routes>
                <Route path="/" element={<JSONGenerator />} />
                <Route path="/validator" element={<JSONValidator />} />
                <Route path="/converter" element={<CSVConverter />} />
                <Route path="/xml-converter" element={<XMLConverter />} />
              </Routes>
            </Suspense>
          </main>
        </Container>
      </ErrorBoundary>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />

      {/* Onboarding Tour */}
      <OnboardingTour />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <PreferencesProvider>
        <AccessibilityProvider>
          <LayoutProvider>
            <Router>
              <AppContent />
            </Router>
          </LayoutProvider>
        </AccessibilityProvider>
      </PreferencesProvider>
    </AppProvider>
  );
};

export default App;