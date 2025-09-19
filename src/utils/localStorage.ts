// src/utils/localStorage.ts
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage:`, error);
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        console.error('localStorage quota exceeded! Size:', (JSON.stringify(value).length / 1024).toFixed(2) + 'KB');
        alert('Storage limit exceeded! Data too large for browser storage (~5-10MB limit).');
      } else {
        console.error('Error writing to localStorage:', error);
      }
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage:`, error);
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error(`Error clearing localStorage:`, error);
    }
  },

  getStorageInfo: (): { used: string; keys: string[]; total: string } => {
    let totalSize = 0;
    const keys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
    }
    
    return {
      used: (totalSize / 1024).toFixed(2) + 'KB',
      keys,
      total: '~5-10MB (browser dependent)'
    };
  }
};