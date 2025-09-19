import '@testing-library/jest-dom';

// Mock console.warn to avoid noise in tests
global.console.warn = jest.fn();

// Add TextEncoder/TextDecoder polyfills for React Router DOM
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder as typeof global.TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Mock window.matchMedia for CSS media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock setTimeout/clearTimeout for React animations
global.setTimeout = jest.fn((fn: () => void, delay: number) => {
  if (delay === 0) fn();
  return 123; // mock timer id
}) as unknown as typeof setTimeout;
global.clearTimeout = jest.fn();