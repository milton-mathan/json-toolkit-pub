// src/utils/validation.ts
export const validationUtils = {
  // Validate key-value pair
  validateKeyValue: (key: string): { isValid: boolean; error?: string } => {
    if (!key.trim()) {
      return { isValid: false, error: 'Key cannot be empty' };
    }

    if (key.includes(' ')) {
      return { isValid: false, error: 'Key cannot contain spaces' };
    }

    if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
      return { isValid: false, error: 'Key must be a valid identifier' };
    }

    return { isValid: true };
  },

  // Check for duplicate keys
  hasDuplicateKeys: (fields: Array<{ key: string }>): boolean => {
    const keys = fields.map(field => field.key);
    return keys.length !== new Set(keys).size;
  },

  // Sanitize key
  sanitizeKey: (key: string): string => {
    return key.replace(/[^a-zA-Z0-9_$]/g, '_').replace(/^[0-9]/, '_$&');
  }
};
