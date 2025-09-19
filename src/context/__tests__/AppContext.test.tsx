import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AppProvider } from '../AppContext';
import { useApp } from '../../hooks/useApp';

// Test component to use the context
const TestComponent: React.FC = () => {
  const { state, dispatch } = useApp();

  return (
    <div>
      <div data-testid="current-tool">{state.currentTool}</div>
      <div data-testid="theme">{state.theme}</div>
      <div data-testid="loading">{state.isLoading.toString()}</div>
      <button 
        data-testid="toggle-theme"
        onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
      >
        Toggle Theme
      </button>
      <button 
        data-testid="set-tool"
        onClick={() => dispatch({ type: 'SET_CURRENT_TOOL', payload: 'json-validator' })}
      >
        Set Tool
      </button>
      <button 
        data-testid="set-loading"
        onClick={() => dispatch({ type: 'SET_LOADING', payload: true })}
      >
        Set Loading
      </button>
    </div>
  );
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock document.documentElement.classList
const mockClassList = {
  toggle: jest.fn(),
};
Object.defineProperty(document.documentElement, 'classList', { value: mockClassList });

describe('AppContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide initial state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('current-tool')).toHaveTextContent('json-generator');
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('should toggle theme and update localStorage', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByTestId('toggle-theme').click();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    expect(mockClassList.toggle).toHaveBeenCalledWith('dark', true);
  });

  it('should set current tool', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByTestId('set-tool').click();
    });

    expect(screen.getByTestId('current-tool')).toHaveTextContent('json-validator');
  });

  it('should set loading state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByTestId('set-loading').click();
    });

    expect(screen.getByTestId('loading')).toHaveTextContent('true');
  });

  it('should throw error when useApp is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useApp must be used within an AppProvider');
    
    consoleSpy.mockRestore();
  });

  it('should toggle theme from dark to light', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // First toggle to dark
    act(() => {
      screen.getByTestId('toggle-theme').click();
    });

    // Then toggle back to light
    act(() => {
      screen.getByTestId('toggle-theme').click();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(localStorageMock.setItem).toHaveBeenLastCalledWith('theme', 'light');
    expect(mockClassList.toggle).toHaveBeenLastCalledWith('dark', false);
  });
});