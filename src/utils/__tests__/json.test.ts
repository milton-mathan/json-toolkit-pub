import { jsonUtils } from '../json';

describe('jsonUtils', () => {
  describe('formatJSON', () => {
    it('should format valid objects correctly', () => {
      const obj = { name: 'test', value: 123 };
      const result = jsonUtils.formatJSON(obj);
      expect(result).toBe('{\n  "name": "test",\n  "value": 123\n}');
    });

    it('should use custom spacing', () => {
      const obj = { test: true };
      const result = jsonUtils.formatJSON(obj, 4);
      expect(result).toBe('{\n    "test": true\n}');
    });

    it('should handle circular references gracefully', () => {
      const obj: Record<string, unknown> = { name: 'test' };
      obj.self = obj;
      const result = jsonUtils.formatJSON(obj);
      expect(result).toBe('');
    });
  });

  describe('isValidJSON', () => {
    it('should return true for valid JSON strings', () => {
      expect(jsonUtils.isValidJSON('{"test": true}')).toBe(true);
      expect(jsonUtils.isValidJSON('[]')).toBe(true);
      expect(jsonUtils.isValidJSON('"string"')).toBe(true);
      expect(jsonUtils.isValidJSON('123')).toBe(true);
      expect(jsonUtils.isValidJSON('null')).toBe(true);
    });

    it('should return false for invalid JSON strings', () => {
      expect(jsonUtils.isValidJSON('{"test": }')).toBe(false);
      expect(jsonUtils.isValidJSON('invalid')).toBe(false);
      expect(jsonUtils.isValidJSON('')).toBe(false);
      expect(jsonUtils.isValidJSON('{')).toBe(false);
    });
  });

  describe('parseJSON', () => {
    it('should parse valid JSON and return data', () => {
      const result = jsonUtils.parseJSON('{"name": "test"}');
      expect(result.data).toEqual({ name: 'test' });
      expect(result.error).toBeNull();
    });

    it('should return error for invalid JSON', () => {
      const result = jsonUtils.parseJSON('invalid json');
      expect(result.data).toBeNull();
      expect(result.error).toContain('Unexpected token');
    });

    it('should handle empty strings', () => {
      const result = jsonUtils.parseJSON('');
      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = jsonUtils.generateId();
      const id2 = jsonUtils.generateId();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    it('should generate IDs with expected format', () => {
      const id = jsonUtils.generateId();
      expect(id).toMatch(/^[a-z0-9]+$/);
    });
  });

  describe('deepClone', () => {
    it('should clone objects deeply', () => {
      const original = { 
        name: 'test', 
        nested: { value: 123, array: [1, 2, 3] } 
      };
      const cloned = jsonUtils.deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.nested).not.toBe(original.nested);
      expect(cloned.nested.array).not.toBe(original.nested.array);
    });

    it('should handle primitive values', () => {
      expect(jsonUtils.deepClone('string')).toBe('string');
      expect(jsonUtils.deepClone(123)).toBe(123);
      expect(jsonUtils.deepClone(true)).toBe(true);
      expect(jsonUtils.deepClone(null)).toBe(null);
    });

    it('should handle circular references gracefully', () => {
      const obj: Record<string, unknown> = { name: 'test' };
      obj.self = obj;
      const result = jsonUtils.deepClone(obj);
      expect(result).toBe(obj); // Should return original if cloning fails
    });
  });
});