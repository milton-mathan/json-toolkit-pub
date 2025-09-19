import { storage } from '../localStorage';

// Mock alert
global.alert = jest.fn();

// Create a proper localStorage mock
let store: { [key: string]: string } = {};
const localStorageMock = {
  getItem: jest.fn((key: string) => store[key] || null),
  setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: jest.fn((key: string) => { delete store[key]; }),
  clear: jest.fn(() => { store = {}; }),
  get length() { return Object.keys(store).length; },
  key: jest.fn((index: number) => Object.keys(store)[index] || null),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('storage', () => {
  beforeEach(() => {
    store = {}; // Clear the store directly
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Reset localStorage mock implementations to defaults
    localStorageMock.getItem.mockImplementation((key: string) => store[key] || null);
    localStorageMock.setItem.mockImplementation((key: string, value: string) => {
      store[key] = value;
    });
    localStorageMock.removeItem.mockImplementation((key: string) => {
      delete store[key];
    });
    localStorageMock.clear.mockImplementation(() => {
      store = {};
    });
    localStorageMock.key.mockImplementation((index: number) => Object.keys(store)[index] || null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('get', () => {
    it('should return stored value', () => {
      localStorage.setItem('test', JSON.stringify({ name: 'John' }));
      const result = storage.get('test', {});
      expect(result).toEqual({ name: 'John' });
    });

    it('should return default value when key does not exist', () => {
      const result = storage.get('nonexistent', 'default');
      expect(result).toBe('default');
    });

    it('should return default value when JSON parsing fails', () => {
      localStorage.setItem('invalid', 'invalid json');
      const result = storage.get('invalid', 'default');
      expect(result).toBe('default');
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle different data types', () => {
      storage.set('string', 'test');
      storage.set('number', 123);
      storage.set('boolean', true);
      storage.set('array', [1, 2, 3]);
      storage.set('object', { test: true });

      expect(storage.get('string', '')).toBe('test');
      expect(storage.get('number', 0)).toBe(123);
      expect(storage.get('boolean', false)).toBe(true);
      expect(storage.get('array', [])).toEqual([1, 2, 3]);
      expect(storage.get('object', {})).toEqual({ test: true });
    });
  });

  describe('set', () => {
    it('should store value correctly', () => {
      storage.set('test', { name: 'John' });
      expect(localStorage.getItem('test')).toBe('{"name":"John"}');
    });

    it('should handle localStorage quota exceeded', () => {
      // Mock localStorage.setItem to throw quota exceeded error
      localStorageMock.setItem.mockImplementation(() => {
        const error = new DOMException('QuotaExceededError');
        Object.defineProperty(error, 'code', { value: 22, writable: false });
        throw error;
      });

      storage.set('test', 'large data');

      expect(console.error).toHaveBeenCalledWith(
        'localStorage quota exceeded! Size:', 
        expect.stringContaining('KB')
      );
      expect(global.alert).toHaveBeenCalledWith(
        'Storage limit exceeded! Data too large for browser storage (~5-10MB limit).'
      );
    });

    it('should handle other localStorage errors', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Some other error');
      });

      storage.set('test', 'data');

      expect(console.error).toHaveBeenCalledWith(
        'Error writing to localStorage:', 
        expect.any(Error)
      );
    });
  });

  describe('remove', () => {
    it('should remove item from localStorage', () => {
      localStorage.setItem('test', 'value');
      storage.remove('test');
      expect(localStorage.getItem('test')).toBeNull();
    });

    it('should handle removal errors gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Remove error');
      });

      storage.remove('test');

      expect(console.error).toHaveBeenCalledWith(
        'Error removing from localStorage:', 
        expect.any(Error)
      );
    });
  });

  describe('clear', () => {
    it('should clear all localStorage', () => {
      localStorage.setItem('test1', 'value1');
      localStorage.setItem('test2', 'value2');
      
      storage.clear();
      
      expect(localStorage.length).toBe(0);
    });

    it('should handle clear errors gracefully', () => {
      localStorageMock.clear.mockImplementation(() => {
        throw new Error('Clear error');
      });

      storage.clear();

      expect(console.error).toHaveBeenCalledWith(
        'Error clearing localStorage:', 
        expect.any(Error)
      );
    });
  });

  describe('getStorageInfo', () => {
    it('should return storage information', () => {
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');
      
      const info = storage.getStorageInfo();
      
      expect(info.keys).toContain('key1');
      expect(info.keys).toContain('key2');
      expect(info.used).toMatch(/\d+\.\d{2}KB/);
      expect(info.total).toBe('~5-10MB (browser dependent)');
    });

    it('should handle empty localStorage', () => {
      const info = storage.getStorageInfo();
      
      expect(info.keys).toEqual([]);
      expect(info.used).toBe('0.00KB');
    });
  });
});