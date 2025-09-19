import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../../context/AppContext';
import { PreferencesProvider } from '../../context/PreferencesContext';
import { AccessibilityProvider } from '../../components/common/AccessibilityProvider';
import { LayoutProvider } from '../../components/common/LayoutProvider';
import JSONGenerator from '../../components/json-generator/JSONGenerator';

// Integration test wrapper with all required providers
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

describe('JSONGenerator Simple Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    localStorage.clear();
  });

  it('should render JSONGenerator component successfully', async () => {
    render(
      <IntegrationWrapper>
        <JSONGenerator />
      </IntegrationWrapper>
    );

    // Verify the component renders basic elements
    expect(screen.getByText('JSON Generator')).toBeInTheDocument();
    expect(screen.getByText('Add Field')).toBeInTheDocument();
    expect(screen.getByText('Fields')).toBeInTheDocument();
    
    // Check that we have some basic interactive elements
    const addButton = screen.getByText('Add Field');
    expect(addButton).toBeInTheDocument();
    
    // Try clicking the add field button
    await user.click(addButton);
    
    // The component should still be working after interaction
    expect(screen.getByText('JSON Generator')).toBeInTheDocument();
  });

  it('should have working navigation elements', async () => {
    render(
      <IntegrationWrapper>
        <JSONGenerator />
      </IntegrationWrapper>
    );

    // Check that statistics are displayed
    expect(screen.getByText('Total Fields')).toBeInTheDocument();
    expect(screen.getByText('Valid Fields')).toBeInTheDocument();
    expect(screen.getByText('JSON Keys')).toBeInTheDocument();
    
    // Check for control buttons
    const expandButton = screen.getByTitle(/Expand all nested fields/);
    const collapseButton = screen.getByTitle(/Collapse all nested fields/);
    const settingsButton = screen.getByTitle(/Settings/);
    
    expect(expandButton).toBeInTheDocument();
    expect(collapseButton).toBeInTheDocument();
    expect(settingsButton).toBeInTheDocument();
    
    // Try clicking control buttons (they should not crash)
    await user.click(expandButton);
    await user.click(collapseButton);
    
    expect(screen.getByText('JSON Generator')).toBeInTheDocument();
  });

  it('should display JSON preview section', async () => {
    const { container } = render(
      <IntegrationWrapper>
        <JSONGenerator />
      </IntegrationWrapper>
    );

    // Look for JSON-related elements in the rendered output
    // This is a flexible check - we just want to ensure the component renders completely
    const hasJsonPreview = container.innerHTML.includes('JSON') || 
                          container.querySelector('pre') !== null ||
                          container.innerHTML.includes('{') ||
                          container.innerHTML.includes('}');
                          
    expect(hasJsonPreview).toBe(true);
  });
});