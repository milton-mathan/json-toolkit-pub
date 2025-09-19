import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../../context/AppContext';
import { PreferencesProvider } from '../../context/PreferencesContext';
import { AccessibilityProvider } from '../../components/common/AccessibilityProvider';
import { LayoutProvider } from '../../components/common/LayoutProvider';
import JSONGenerator from '../../components/json-generator/JSONGenerator';

// Simple integration test wrapper
const IntegrationWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AppProvider>
      <PreferencesProvider>
        <AccessibilityProvider>
          <LayoutProvider>
            {children}
          </LayoutProvider>
        </AccessibilityProvider>
      </PreferencesProvider>
    </AppProvider>
  </BrowserRouter>
);

describe('JSONGenerator Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render JSONGenerator component successfully', () => {
    render(
      <IntegrationWrapper>
        <JSONGenerator />
      </IntegrationWrapper>
    );

    // Basic rendering verification
    expect(screen.getByText('JSON Generator')).toBeInTheDocument();
    expect(screen.getByText('Add Field')).toBeInTheDocument();
    expect(screen.getByText('Fields')).toBeInTheDocument();
  });

  it('should display statistics section', () => {
    render(
      <IntegrationWrapper>
        <JSONGenerator />
      </IntegrationWrapper>
    );

    // Check statistics are displayed
    expect(screen.getByText('Total Fields')).toBeInTheDocument();
    expect(screen.getByText('Valid Fields')).toBeInTheDocument();
    expect(screen.getByText('JSON Keys')).toBeInTheDocument();
  });

  it('should have control buttons available', () => {
    render(
      <IntegrationWrapper>
        <JSONGenerator />
      </IntegrationWrapper>
    );

    // Look for control elements by title attributes
    expect(screen.getByTitle(/Expand all nested fields/)).toBeInTheDocument();
    expect(screen.getByTitle(/Collapse all nested fields/)).toBeInTheDocument();
    expect(screen.getByTitle(/Settings/)).toBeInTheDocument();
  });
});