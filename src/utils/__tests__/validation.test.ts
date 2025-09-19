import { validationUtils } from '../validation';

describe('validationUtils', () => {
  describe('validateKeyValue', () => {
    it('should validate correct keys', () => {
      const validKeys = ['name', 'firstName', 'user_id', '$value', '_private'];
      
      validKeys.forEach(key => {
        const result = validationUtils.validateKeyValue(key);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject empty keys', () => {
      const result = validationUtils.validateKeyValue('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Key cannot be empty');
    });

    it('should reject keys with spaces', () => {
      const result = validationUtils.validateKeyValue('user name');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Key cannot contain spaces');
    });

    it('should reject invalid identifiers', () => {
      const invalidKeys = ['123abc', 'user-name', 'user.name', 'user@name'];
      
      invalidKeys.forEach(key => {
        const result = validationUtils.validateKeyValue(key);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Key must be a valid identifier');
      });
    });

    it('should handle whitespace-only keys', () => {
      const result = validationUtils.validateKeyValue('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Key cannot be empty');
    });
  });

  describe('hasDuplicateKeys', () => {
    it('should return false for unique keys', () => {
      const fields = [
        { key: 'name' },
        { key: 'age' },
        { key: 'email' }
      ];
      expect(validationUtils.hasDuplicateKeys(fields)).toBe(false);
    });

    it('should return true for duplicate keys', () => {
      const fields = [
        { key: 'name' },
        { key: 'age' },
        { key: 'name' }
      ];
      expect(validationUtils.hasDuplicateKeys(fields)).toBe(true);
    });

    it('should handle empty arrays', () => {
      expect(validationUtils.hasDuplicateKeys([])).toBe(false);
    });

    it('should handle single item arrays', () => {
      const fields = [{ key: 'name' }];
      expect(validationUtils.hasDuplicateKeys(fields)).toBe(false);
    });
  });

  describe('sanitizeKey', () => {
    it('should replace invalid characters with underscores', () => {
      expect(validationUtils.sanitizeKey('user-name')).toBe('user_name');
      expect(validationUtils.sanitizeKey('user.email')).toBe('user_email');
      expect(validationUtils.sanitizeKey('user@domain')).toBe('user_domain');
      expect(validationUtils.sanitizeKey('user name')).toBe('user_name');
    });

    it('should prefix numbers with underscore', () => {
      expect(validationUtils.sanitizeKey('123abc')).toBe('_123abc');
      expect(validationUtils.sanitizeKey('9field')).toBe('_9field');
    });

    it('should keep valid keys unchanged', () => {
      const validKeys = ['name', 'firstName', 'user_id', '$value', '_private'];
      validKeys.forEach(key => {
        expect(validationUtils.sanitizeKey(key)).toBe(key);
      });
    });

    it('should handle complex invalid keys', () => {
      expect(validationUtils.sanitizeKey('123-user.name@domain')).toBe('_123_user_name_domain');
    });
  });
});