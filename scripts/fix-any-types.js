#!/usr/bin/env node

/**
 * Fix TypeScript 'any' types with proper type annotations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const fixes = [
  // src/utils/json.ts
  {
    file: 'src/utils/json.ts',
    replacements: [
      {
        from: 'export const parseJSONValue = (value: any): any => {',
        to: 'export const parseJSONValue = (value: string | number | boolean | null): string | number | boolean | null => {'
      },
      {
        from: 'export const generateJSONFromFields = (fields: JSONField[]): any => {',
        to: 'export const generateJSONFromFields = (fields: JSONField[]): Record<string, unknown> => {'
      }
    ]
  },
  
  // src/utils/performance.ts
  {
    file: 'src/utils/performance.ts',
    replacements: [
      {
        from: 'export const debounce = <T extends (...args: any[]) => any>(',
        to: 'export const debounce = <T extends (...args: unknown[]) => unknown>('
      },
      {
        from: 'export const throttle = <T extends (...args: any[]) => any>(',
        to: 'export const throttle = <T extends (...args: unknown[]) => unknown>('
      },
      {
        from: 'const measure = <T extends (...args: any[]) => any>(',
        to: 'const measure = <T extends (...args: unknown[]) => unknown>('
      },
      {
        from: 'fn: (...args: any[]) => any,',
        to: 'fn: (...args: unknown[]) => unknown,'
      }
    ]
  },
  
  // src/utils/file.ts
  {
    file: 'src/utils/file.ts',
    replacements: [
      {
        from: 'export const downloadJSON = (data: any, filename: string = \'data.json\') => {',
        to: 'export const downloadJSON = (data: Record<string, unknown> | unknown[], filename: string = \'data.json\') => {'
      }
    ]
  },
  
  // src/utils/validation.ts
  {
    file: 'src/utils/validation.ts',
    replacements: [
      {
        from: 'export const validateFieldValue = (key: string, _value: any): boolean => {',
        to: 'export const validateFieldValue = (key: string, _value: unknown): boolean => {'
      }
    ]
  },
  
  // Test files - use unknown for test data
  {
    file: 'src/utils/__tests__/json.test.ts',
    replacements: [
      {
        from: ': any',
        to: ': unknown'
      }
    ]
  },
  
  {
    file: 'src/utils/__tests__/localStorage.test.ts',
    replacements: [
      {
        from: ': any',
        to: ': unknown'
      }
    ]
  },
  
  {
    file: 'src/utils/__tests__/performance.test.ts',
    replacements: [
      {
        from: ': any',
        to: ': unknown'
      }
    ]
  },
  
  {
    file: 'tests/cross-browser/compatibility.spec.ts',
    replacements: [
      {
        from: ': any',
        to: ': unknown'
      }
    ]
  }
];

console.log('🔧 Fixing TypeScript "any" types...');

fixes.forEach(({ file, replacements }) => {
  const filePath = path.join(projectRoot, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changeCount = 0;
  
  replacements.forEach(({ from, to }) => {
    const newContent = content.replaceAll(from, to);
    if (newContent !== content) {
      content = newContent;
      changeCount++;
    }
  });
  
  if (changeCount > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${changeCount} issues in ${file}`);
  } else {
    console.log(`📝 No changes needed in ${file}`);
  }
});

console.log('✨ TypeScript "any" type fixes completed!');