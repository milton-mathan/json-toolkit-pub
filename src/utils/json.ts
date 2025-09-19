// src/utils/json.ts
export const jsonUtils = {
  // Pretty format JSON string
  formatJSON: (obj: unknown, spaces: number = 2): string => {
    try {
      return JSON.stringify(obj, null, spaces);
    } catch (error) {
      console.error('Error formatting JSON:', error);
      return '';
    }
  },

  // Validate JSON string
  isValidJSON: (str: string): boolean => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  },

  // Parse JSON with error handling
  parseJSON: (str: string): { data: unknown; error: string | null } => {
    try {
      const data = JSON.parse(str);
      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Invalid JSON' 
      };
    }
  },

  // Generate unique ID
  generateId: (): string => {
    return Math.random().toString(36).substr(2, 9);
  },

  // Deep clone object
  deepClone: <T>(obj: T): T => {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (error) {
      console.error('Error cloning object:', error);
      return obj;
    }
  }
};
