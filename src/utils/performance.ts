// src/utils/performance.ts
export const performanceUtils = {
  // Debounce function for performance optimization
  debounce: <T extends (...args: unknown[]) => void>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },

  // Throttle function for scroll/resize events
  throttle: <T extends (...args: unknown[]) => void>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  },

  // Measure performance of operations
  measurePerformance: <T>(
    name: string,
    operation: () => T
  ): T => {
    const start = performance.now();
    const result = operation();
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${name} took ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  },

  // Deep equality check for React memoization - Fixed TypeScript issues
  deepEqual: (obj1: unknown, obj2: unknown): boolean => {
    if (obj1 === obj2) return true;
    
    if (obj1 == null || obj2 == null) return obj1 === obj2;
    
    if (typeof obj1 !== typeof obj2) return false;
    
    if (typeof obj1 !== 'object') return obj1 === obj2;
    
    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!performanceUtils.deepEqual((obj1 as Record<string, unknown>)[key], (obj2 as Record<string, unknown>)[key])) return false;
    }
    
    return true;
  },

  // Safe property access helper
  safeGet: <T>(obj: unknown, path: string, defaultValue: T): T => {
    try {
      const value = path.split('.').reduce((current, key) => {
        return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
      }, obj);
      return value !== undefined ? value as T : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  // Batch updates for performance
  batchUpdates: <T>(updates: Array<() => T>): T[] => {
    const results: T[] = [];
    updates.forEach(update => {
      try {
        results.push(update());
      } catch (error) {
        console.error('Error in batched update:', error);
      }
    });
    return results;
  }
};