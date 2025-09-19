import { performanceUtils } from '../performance';

// Mock timers
jest.useFakeTimers();

describe('performanceUtils', () => {
  describe('debounce', () => {
    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = performanceUtils.debounce(mockFn, 100);

      debouncedFn('test1');
      debouncedFn('test2');
      debouncedFn('test3');

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test3');
    });

    it('should reset timer on subsequent calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = performanceUtils.debounce(mockFn, 100);

      debouncedFn('test1');
      jest.advanceTimersByTime(50);
      debouncedFn('test2');
      jest.advanceTimersByTime(50);

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test2');
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', () => {
      const mockFn = jest.fn();
      const throttledFn = performanceUtils.throttle(mockFn, 100);

      throttledFn('test1');
      throttledFn('test2');
      throttledFn('test3');

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test1');
    });

    it('should allow calls after delay', () => {
      const mockFn = jest.fn();
      const throttledFn = performanceUtils.throttle(mockFn, 100);

      throttledFn('test1');
      jest.advanceTimersByTime(100);
      throttledFn('test2');

      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenNthCalledWith(1, 'test1');
      expect(mockFn).toHaveBeenNthCalledWith(2, 'test2');
    });
  });

  describe('measurePerformance', () => {
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(performance, 'now').mockReturnValueOnce(0).mockReturnValueOnce(100);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should measure and return operation result', () => {
      const operation = jest.fn(() => 'result');
      const result = performanceUtils.measurePerformance('test', operation);

      expect(result).toBe('result');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should log performance in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const operation = () => 'result';
      performanceUtils.measurePerformance('test operation', operation);

      expect(console.log).toHaveBeenCalledWith('test operation took 100.00ms');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('deepEqual', () => {
    it('should return true for identical values', () => {
      expect(performanceUtils.deepEqual(1, 1)).toBe(true);
      expect(performanceUtils.deepEqual('test', 'test')).toBe(true);
      expect(performanceUtils.deepEqual(true, true)).toBe(true);
    });

    it('should return true for deeply equal objects', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { a: 1, b: { c: 2 } };
      expect(performanceUtils.deepEqual(obj1, obj2)).toBe(true);
    });

    it('should return false for different values', () => {
      expect(performanceUtils.deepEqual(1, 2)).toBe(false);
      expect(performanceUtils.deepEqual('test', 'other')).toBe(false);
      expect(performanceUtils.deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(performanceUtils.deepEqual(null, null)).toBe(true);
      expect(performanceUtils.deepEqual(undefined, undefined)).toBe(true);
      expect(performanceUtils.deepEqual(null, undefined)).toBe(false);
    });

    it('should handle arrays correctly', () => {
      expect(performanceUtils.deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(performanceUtils.deepEqual([1, 2], [1, 2, 3])).toBe(false);
      expect(performanceUtils.deepEqual([], {})).toBe(false);
    });
  });

  describe('safeGet', () => {
    const testObj = {
      user: {
        profile: {
          name: 'John',
          age: 30
        }
      }
    };

    it('should return nested property values', () => {
      expect(performanceUtils.safeGet(testObj, 'user.profile.name', 'default')).toBe('John');
      expect(performanceUtils.safeGet(testObj, 'user.profile.age', 0)).toBe(30);
    });

    it('should return default value for non-existent paths', () => {
      expect(performanceUtils.safeGet(testObj, 'user.profile.email', 'none')).toBe('none');
      expect(performanceUtils.safeGet(testObj, 'user.settings.theme', 'light')).toBe('light');
    });

    it('should handle null/undefined objects', () => {
      expect(performanceUtils.safeGet(null, 'user.name', 'default')).toBe('default');
      expect(performanceUtils.safeGet(undefined, 'user.name', 'default')).toBe('default');
    });
  });

  describe('batchUpdates', () => {
    it('should execute all updates and return results', () => {
      const updates = [
        () => 1,
        () => 2,
        () => 'test' as unknown
      ];

      const results = performanceUtils.batchUpdates(updates);
      expect(results).toEqual([1, 2, 'test']);
    });

    it('should handle errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const updates = [
        () => 1,
        () => { throw new Error('test error'); },
        () => 3
      ];

      const results = performanceUtils.batchUpdates(updates);
      expect(results).toEqual([1, 3]);
      expect(consoleSpy).toHaveBeenCalledWith('Error in batched update:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});