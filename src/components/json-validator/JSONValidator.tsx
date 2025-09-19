// src/components/json-validator/JSONValidator.tsx - Enhanced Version with Schema Validation
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
// import { jsonUtils } from '../../utils/json'; // Not used
import { fileUtils } from '../../utils/file';
import { performanceUtils } from '../../utils/performance';
import { storage } from '../../utils/localStorage';

interface ValidationError {
  message: string;
  lineNumber?: number;
  columnNumber?: number;
  position?: number;
  severity: 'error' | 'warning';
  source?: 'syntax' | 'schema';
  schemaPath?: string;
  instancePath?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  formattedJSON?: string;
  parsedData?: unknown;
  stats?: {
    objects: number;
    arrays: number;
    properties: number;
    depth: number;
  };
  schemaValidation?: {
    isValid: boolean;
    errors: ValidationError[];
  };
}

interface HistoryEntry {
  id: string;
  timestamp: Date;
  inputText: string;
  schemaText?: string;
  result: ValidationResult;
}

interface JSONValidatorState {
  inputText: string;
  validationResult: ValidationResult | null;
  isLoading: boolean;
  fileName?: string;
  currentErrorIndex: number;
  showFormatted: boolean;
  isDarkMode: boolean;
  schemaText: string;
  enableSchemaValidation: boolean;
  selectedTemplate: string;
  validationHistory: HistoryEntry[];
  showHistoryPanel: boolean;
  showSchemaHelp: boolean;
}

const JSONValidator: React.FC = () => {
  const [state, setState] = useState<JSONValidatorState>({
    inputText: '',
    validationResult: null,
    isLoading: false,
    currentErrorIndex: 0,
    showFormatted: false,
    isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    schemaText: '',
    enableSchemaValidation: false,
    selectedTemplate: '',
    validationHistory: [],
    showHistoryPanel: false,
    showSchemaHelp: false
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const schemaTextareaRef = useRef<HTMLTextAreaElement>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  // Initialize AJV with formats
  const ajv = useRef<Ajv | undefined>(undefined);
  
  if (!ajv.current) {
    const ajvInstance = new Ajv({ allErrors: true, verbose: true });
    addFormats(ajvInstance);
    ajv.current = ajvInstance;
  }
  
  // Pre-built schema templates
  const schemaTemplates = {
    'user-profile': {
      name: 'User Profile',
      description: 'Common user profile schema with name, email, and age',
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          age: { type: 'integer', minimum: 0, maximum: 120 },
          active: { type: 'boolean' }
        },
        required: ['name', 'email'],
        additionalProperties: false
      }
    },
    'api-response': {
      name: 'API Response',
      description: 'Standard API response with status, message, and data',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['success', 'error'] },
          message: { type: 'string' },
          data: { type: 'object' },
          timestamp: { type: 'string', format: 'date-time' }
        },
        required: ['status', 'message'],
        additionalProperties: true
      }
    },
    'product-catalog': {
      name: 'Product Catalog',
      description: 'E-commerce product with pricing and inventory',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', minLength: 1 },
          description: { type: 'string' },
          price: { type: 'number', minimum: 0 },
          currency: { type: 'string', pattern: '^[A-Z]{3}$' },
          inStock: { type: 'boolean' },
          categories: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1
          }
        },
        required: ['id', 'name', 'price', 'currency'],
        additionalProperties: false
      }
    },
    'array-of-objects': {
      name: 'Array of Objects',
      description: 'Array containing objects with consistent structure',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string', minLength: 1 },
            completed: { type: 'boolean' }
          },
          required: ['id', 'title', 'completed'],
          additionalProperties: false
        },
        minItems: 1
      }
    }
  };

  // Load saved data on mount
  useEffect(() => {
    const savedInput = storage.get('json-validator-input', '');
    const savedShowFormatted = storage.get('json-validator-show-formatted', false);
    const savedSchemaText = storage.get('json-validator-schema', '');
    const savedEnableSchema = storage.get('json-validator-enable-schema', false);
    const savedHistory = storage.get('json-validator-history', []);
    
    setState(prev => ({ 
      ...prev, 
      inputText: savedInput,
      showFormatted: savedShowFormatted,
      schemaText: savedSchemaText,
      enableSchemaValidation: savedEnableSchema,
      validationHistory: savedHistory
    }));
  }, []);

  // Listen for global shortcut events
  useEffect(() => {
    const handleGlobalShortcut = (e: CustomEvent) => {
      const { action } = e.detail;
      
      switch (action) {
        case 'clear-input':
          setState(prev => ({ ...prev, inputText: '', schemaText: '', validationResult: null }));
          storage.set('json-validator-input', '');
          storage.set('json-validator-schema', '');
          break;
        case 'format-json':
          if (state.validationResult?.formattedJSON) {
            setState(prev => ({ ...prev, inputText: state.validationResult!.formattedJSON! }));
            storage.set('json-validator-input', state.validationResult.formattedJSON);
          }
          break;
        case 'validate-json':
          validateJSON(state.inputText, state.schemaText);
          break;
        case 'copy-output':
          if (state.validationResult?.formattedJSON) {
            navigator.clipboard.writeText(state.validationResult.formattedJSON);
          }
          break;
        case 'save-file':
          if (state.validationResult?.formattedJSON) {
            const blob = new Blob([state.validationResult.formattedJSON], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'validated.json';
            a.click();
            URL.revokeObjectURL(url);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('global-shortcut', handleGlobalShortcut as EventListener);
    return () => window.removeEventListener('global-shortcut', handleGlobalShortcut as EventListener);
  }, [state.inputText, state.schemaText, state.validationResult]);

  // Add to validation history
  const addToValidationHistory = useCallback((inputText: string, schemaText: string, result: ValidationResult) => {
    const historyEntry: HistoryEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      inputText,
      schemaText: schemaText || undefined,
      result
    };
    
    setState(prev => {
      const newHistory = [historyEntry, ...prev.validationHistory].slice(0, 10); // Keep only last 10
      storage.set('json-validator-history', newHistory);
      return { ...prev, validationHistory: newHistory };
    });
  }, []);

  // Enhanced JSON validation with detailed error analysis and schema validation
  const validateJSON = useCallback((text: string, schemaText?: string) => {
    if (!text.trim()) {
      setState(prev => ({
        ...prev,
        validationResult: null
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    // Clear any existing error timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }

    const syntaxErrors: ValidationError[] = [];
    let parsed: unknown;
    let formatted: string | undefined;
    let stats: ValidationResult['stats'];

    try {
      parsed = JSON.parse(text);
      formatted = JSON.stringify(parsed, null, 2);
      stats = calculateJSONStats(parsed);
    } catch (error) {
      const errors = parseJSONError(error, text);
      const result: ValidationResult = {
        isValid: false,
        errors,
        stats: undefined
      };
      
      setState(prev => ({
        ...prev,
        validationResult: result,
        isLoading: false,
        currentErrorIndex: 0
      }));
      
      // Save to validation history
      addToValidationHistory(text, schemaText || state.schemaText, result);
      return;
    }

    // Schema validation if enabled
    let schemaValidation: ValidationResult['schemaValidation'] | undefined;
    const shouldValidateSchema = state.enableSchemaValidation && (schemaText || state.schemaText).trim();
    
    if (shouldValidateSchema && ajv.current) {
      const currentSchemaText = schemaText || state.schemaText;
      try {
        const schemaObj = JSON.parse(currentSchemaText);
        const validate = ajv.current.compile(schemaObj);
        const isSchemaValid = validate(parsed);
        
        const schemaErrors: ValidationError[] = [];
        
        if (!isSchemaValid && validate.errors) {
          validate.errors.forEach((error) => {
            schemaErrors.push({
              message: `${error.instancePath || 'root'}: ${error.message}`,
              severity: 'error',
              source: 'schema',
              schemaPath: error.schemaPath,
              instancePath: error.instancePath || '/'
            });
          });
        }
        
        schemaValidation = {
          isValid: isSchemaValid,
          errors: schemaErrors
        };
      } catch (schemaError) {
        schemaValidation = {
          isValid: false,
          errors: [{
            message: 'Invalid schema: ' + (schemaError instanceof Error ? schemaError.message : 'Unknown error'),
            severity: 'error',
            source: 'schema'
          }]
        };
      }
    }

    const allErrors = [...syntaxErrors, ...(schemaValidation?.errors || [])];
    const isOverallValid = syntaxErrors.length === 0 && (schemaValidation?.isValid !== false);
    
    const result: ValidationResult = {
      isValid: isOverallValid,
      errors: allErrors,
      formattedJSON: formatted,
      parsedData: parsed,
      stats,
      schemaValidation
    };
    
    setState(prev => ({
      ...prev,
      validationResult: result,
      isLoading: false,
      currentErrorIndex: 0
    }));
    
    // Save to validation history
    addToValidationHistory(text, schemaText || state.schemaText, result);
  }, [state.enableSchemaValidation, state.schemaText, addToValidationHistory]);

  // Parse JSON error into detailed error information
  const parseJSONError = (error: Error, text: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (error instanceof SyntaxError) {
      let message = error.message;
      let lineNumber: number | undefined;
      let columnNumber: number | undefined;
      let position: number | undefined;

      // Extract position from error message
      const positionMatch = message.match(/at position (\d+)/);
      if (positionMatch) {
        position = parseInt(positionMatch[1], 10);
        const lines = text.substring(0, position).split('\n');
        lineNumber = lines.length;
        columnNumber = lines[lines.length - 1].length + 1;
      }

      // Clean up error message
      if (message.includes('Unexpected token')) {
        const tokenMatch = message.match(/Unexpected token (.+?) in JSON/);
        if (tokenMatch) {
          const token = tokenMatch[1];
          message = `Unexpected character '${token}'. Check for missing quotes, commas, or brackets.`;
        }
      } else if (message.includes('Unexpected end of JSON input')) {
        message = 'Unexpected end of input. The JSON appears to be incomplete.';
      } else if (message.includes('Expected property name')) {
        message = 'Expected property name. Object properties must be quoted strings.';
      }

      errors.push({
        message,
        lineNumber,
        columnNumber,
        position,
        severity: 'error',
        source: 'syntax'
      });

      // Add additional context-aware suggestions
      if (position !== undefined) {
        const context = getErrorContext(text, position);
        const suggestions = generateErrorSuggestions(context, text, position);
        errors.push(...suggestions);
      }
    } else {
      errors.push({
        message: 'Unknown JSON parsing error',
        severity: 'error',
        source: 'syntax'
      });
    }

    return errors;
  };

  // Get error context around position
  const getErrorContext = (text: string, position: number) => {
    const start = Math.max(0, position - 20);
    const end = Math.min(text.length, position + 20);
    return {
      before: text.substring(start, position),
      at: text[position] || '',
      after: text.substring(position + 1, end),
      char: text[position]
    };
  };

  // Generate helpful error suggestions
  const generateErrorSuggestions = (context: unknown, text: string): ValidationError[] => {
    const suggestions: ValidationError[] = [];
    
    // Check for common mistakes
    if (context.char === "'" && !context.before.includes('"')) {
      suggestions.push({
        message: "Use double quotes (\") instead of single quotes (') for strings in JSON",
        severity: 'warning',
        source: 'syntax'
      });
    }
    
    if (context.before.endsWith(',') && context.after.match(/^\s*[}\]]/)) {
      suggestions.push({
        message: "Remove trailing comma before closing bracket/brace",
        severity: 'warning',
        source: 'syntax'
      });
    }
    
    if (context.char === undefined && text.trim().endsWith(',')) {
      suggestions.push({
        message: "JSON appears incomplete. Add closing brackets/braces or remove trailing comma",
        severity: 'warning',
        source: 'syntax'
      });
    }

    return suggestions;
  };

  // Calculate JSON statistics
  const calculateJSONStats = (data: unknown): ValidationResult['stats'] => {
    let objects = 0;
    let arrays = 0;
    let properties = 0;
    let maxDepth = 0;

    const traverse = (obj: unknown, depth: number = 0) => {
      maxDepth = Math.max(maxDepth, depth);
      
      if (Array.isArray(obj)) {
        arrays++;
        obj.forEach(item => traverse(item, depth + 1));
      } else if (obj && typeof obj === 'object') {
        objects++;
        const keys = Object.keys(obj);
        properties += keys.length;
        keys.forEach(key => traverse(obj[key], depth + 1));
      }
    };

    traverse(data);
    
    return { objects, arrays, properties, depth: maxDepth };
  };

  // Debounced validation
  const debouncedValidate = useCallback(
    performanceUtils.debounce((text: string) => {
      validateJSON(text);
    }, 300),
    [validateJSON]
  );

  // Handle text input changes
  const handleInputChange = useCallback((value: string) => {
    setState(prev => ({ ...prev, inputText: value }));
    storage.set('json-validator-input', value);
    debouncedValidate(value);
  }, [debouncedValidate]);

  // Handle schema input changes
  const handleSchemaChange = useCallback((value: string) => {
    setState(prev => ({ ...prev, schemaText: value }));
    storage.set('json-validator-schema', value);
    if (state.enableSchemaValidation && state.inputText.trim()) {
      debouncedValidate(state.inputText);
    }
  }, [state.enableSchemaValidation, state.inputText, debouncedValidate]);

  // Toggle schema validation
  const toggleSchemaValidation = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, enableSchemaValidation: enabled }));
    storage.set('json-validator-enable-schema', enabled);
    if (state.inputText.trim()) {
      validateJSON(state.inputText);
    }
  }, [state.inputText, validateJSON]);

  // Load schema template
  const loadSchemaTemplate = useCallback((templateKey: string) => {
    const template = schemaTemplates[templateKey as keyof typeof schemaTemplates];
    if (template) {
      const schemaText = JSON.stringify(template.schema, null, 2);
      setState(prev => ({ ...prev, schemaText: schemaText, selectedTemplate: templateKey }));
      storage.set('json-validator-schema', schemaText);
      if (state.enableSchemaValidation && state.inputText.trim()) {
        validateJSON(state.inputText, schemaText);
      }
    }
  }, [state.enableSchemaValidation, state.inputText, validateJSON]);

  // Navigate to specific error with enhanced positioning
  const goToError = useCallback((errorIndex: number) => {
    const error = state.validationResult?.errors[errorIndex];
    if (!error || !textareaRef.current) return;

    setState(prev => ({ ...prev, currentErrorIndex: errorIndex }));

    if (error.position !== undefined) {
      // Focus the textarea
      textareaRef.current.focus();
      
      // Calculate the line for better positioning
      const lines = state.inputText.substring(0, error.position).split('\n');
      const currentLine = lines.length - 1;
      
      // Highlight a few characters around the error for better visibility
      const selectionStart = error.position;
      const selectionEnd = Math.min(error.position + 5, state.inputText.length);
      textareaRef.current.setSelectionRange(selectionStart, selectionEnd);
      
      // Enhanced scrolling with better positioning
      const textarea = textareaRef.current;
      const style = window.getComputedStyle(textarea);
      const lineHeight = parseInt(style.lineHeight) || 20;
      const containerHeight = textarea.clientHeight;
      const linesVisible = Math.floor(containerHeight / lineHeight);
      
      // Position error line in center of viewport if possible
      const targetScrollLine = Math.max(0, currentLine - Math.floor(linesVisible / 2));
      textarea.scrollTop = targetScrollLine * lineHeight;
      
      // Add visual feedback
      textarea.style.transition = 'box-shadow 0.3s ease';
      textarea.style.boxShadow = '0 0 0 2px #ef4444, 0 0 10px rgba(239, 68, 68, 0.3)';
      
      // Remove visual feedback after 2 seconds
      setTimeout(() => {
        if (textarea) {
          textarea.style.boxShadow = '';
          textarea.style.transition = '';
        }
      }, 2000);
    } else if (error.lineNumber) {
      // For errors without position, use line number
      const lines = state.inputText.split('\n');
      if (error.lineNumber <= lines.length) {
        const lineStartPos = lines.slice(0, error.lineNumber - 1).join('\n').length + (error.lineNumber > 1 ? 1 : 0);
        const lineContent = lines[error.lineNumber - 1];
        
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(lineStartPos, lineStartPos + lineContent.length);
        
        const lineHeight = 20;
        textareaRef.current.scrollTop = Math.max(0, (error.lineNumber - 3) * lineHeight);
      }
    }
  }, [state.validationResult?.errors, state.inputText]);

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setState(prev => ({ ...prev, isLoading: true, fileName: file.name }));

    try {
      const text = await fileUtils.readFileAsText(file);
      handleInputChange(text);
    } catch {
      setState(prev => ({
        ...prev,
        isLoading: false,
        validationResult: {
          isValid: false,
          errors: [{
            message: 'Failed to read file. Please ensure it\'s a valid text file.',
            severity: 'error',
            source: 'syntax'
          }]
        }
      }));
    }
  }, [handleInputChange]);

  // Setup dropzone with better file type handling
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/plain': ['.txt'],
      'text/javascript': ['.js'],
      'application/javascript': ['.js']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB limit
  });

  // Handle paste from clipboard
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleInputChange(text);
    } catch {
      setState(prev => ({
        ...prev,
        validationResult: {
          isValid: false,
          errors: [{
            message: 'Failed to read from clipboard. Please check browser permissions.',
            severity: 'error',
            source: 'syntax'
          }]
        }
      }));
    }
  }, [handleInputChange]);

  // Auto-fix common issues
  const handleAutoFix = useCallback(() => {
    let fixedText = state.inputText;
    
    // Fix single quotes to double quotes
    fixedText = fixedText.replace(/'/g, '"');
    
    // Remove trailing commas
    fixedText = fixedText.replace(/,(\s*[}\]])/g, '$1');
    
    // Add missing quotes around unquoted keys
    fixedText = fixedText.replace(/(\w+)(\s*:)/g, '"$1"$2');
    
    handleInputChange(fixedText);
  }, [state.inputText, handleInputChange]);

  // Toggle formatted view
  const toggleFormattedView = useCallback(() => {
    setState(prev => {
      const newShowFormatted = !prev.showFormatted;
      storage.set('json-validator-show-formatted', newShowFormatted);
      return { ...prev, showFormatted: newShowFormatted };
    });
  }, []);

  // Other existing handlers
  const handleClear = useCallback(() => {
    handleInputChange('');
    setState(prev => ({ ...prev, fileName: undefined }));
  }, [handleInputChange]);

  const handleCopyFormatted = useCallback(async () => {
    if (state.validationResult?.formattedJSON) {
      await fileUtils.copyToClipboard(state.validationResult.formattedJSON);
      // Add visual feedback here if needed
    }
  }, [state.validationResult?.formattedJSON]);

  const handleDownload = useCallback(() => {
    if (state.validationResult?.formattedJSON) {
      try {
        const parsed = JSON.parse(state.validationResult.formattedJSON);
        fileUtils.downloadJSON(parsed, state.fileName?.replace(/\.[^/.]+$/, '') + '_formatted.json' || 'formatted.json');
      } catch (error) {
        console.error('Failed to download formatted JSON:', error);
      }
    }
  }, [state.validationResult?.formattedJSON, state.fileName]);

  const handleFormat = useCallback(() => {
    if (state.validationResult?.isValid && state.validationResult.formattedJSON) {
      handleInputChange(state.validationResult.formattedJSON);
    }
  }, [state.validationResult, handleInputChange]);

  // Load validation from history
  const loadFromHistory = useCallback((entry: HistoryEntry) => {
    handleInputChange(entry.inputText);
    if (entry.schemaText) {
      setState(prev => ({ 
        ...prev, 
        schemaText: entry.schemaText || '',
        enableSchemaValidation: true
      }));
      storage.set('json-validator-schema', entry.schemaText);
      storage.set('json-validator-enable-schema', true);
    }
  }, [handleInputChange]);

  const errors = state.validationResult?.errors.filter(e => e.severity === 'error') || [];
  const warnings = state.validationResult?.errors.filter(e => e.severity === 'warning') || [];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          JSON Validator
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Validate, format, and analyze your JSON data with schema validation
        </p>
      </div>

      {/* Schema Validation Toggle */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={state.enableSchemaValidation}
              onChange={(e) => toggleSchemaValidation(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-blue-900 dark:text-blue-100 font-medium">
              Enable Schema Validation
            </span>
          </label>
          
          <button
            onClick={() => setState(prev => ({ ...prev, showSchemaHelp: !prev.showSchemaHelp }))}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        {state.showSchemaHelp && (
          <div className="bg-blue-100 dark:bg-blue-800/30 rounded-lg p-3 mb-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">JSON Schema Validation</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              JSON Schema allows you to validate the structure, data types, and constraints of your JSON data.
              Use the templates below or write your own schema.
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• <strong>type</strong>: Validate data type (object, array, string, number, boolean, null)</li>
              <li>• <strong>required</strong>: Specify required properties in objects</li>
              <li>• <strong>properties</strong>: Define object property schemas</li>
              <li>• <strong>items</strong>: Define array item schemas</li>
              <li>• <strong>minimum/maximum</strong>: Set numeric constraints</li>
              <li>• <strong>minLength/maxLength</strong>: Set string length constraints</li>
              <li>• <strong>pattern</strong>: Validate strings with regex</li>
              <li>• <strong>format</strong>: Built-in formats (email, date-time, uri, etc.)</li>
            </ul>
          </div>
        )}

        {state.enableSchemaValidation && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Schema Templates */}
            <div>
              <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Schema Templates
              </label>
              <select
                value={state.selectedTemplate}
                onChange={(e) => {
                  setState(prev => ({ ...prev, selectedTemplate: e.target.value }));
                  if (e.target.value) {
                    loadSchemaTemplate(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="">Select a template...</option>
                {Object.entries(schemaTemplates).map(([key, template]) => (
                  <option key={key} value={key}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Schema Input */}
            <div>
              <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                JSON Schema
              </label>
              <textarea
                ref={schemaTextareaRef}
                value={state.schemaText}
                onChange={(e) => handleSchemaChange(e.target.value)}
                placeholder="Enter your JSON schema here..."
                className="w-full h-32 px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                spellCheck={false}
              />
            </div>
          </div>
        )}
      </div>

      {/* Validation History Panel */}
      {state.validationHistory.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Validation History
            </h3>
            <button
              onClick={() => setState(prev => ({ ...prev, showHistoryPanel: !prev.showHistoryPanel }))}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={state.showHistoryPanel ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </button>
          </div>
          
          {state.showHistoryPanel && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {state.validationHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600"
                  onClick={() => loadFromHistory(entry)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${entry.result.isValid ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {entry.inputText.substring(0, 50)}...
                      </span>
                      {entry.schemaText && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                          Schema
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {entry.timestamp.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Enhanced File Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${isDragActive && !isDragReject
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-102' 
            : isDragReject
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }
        `}
        data-tour="json-input"
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <svg
            className={`mx-auto h-12 w-12 ${isDragReject ? 'text-red-400' : 'text-gray-400'}`}
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-gray-600 dark:text-gray-400">
            {isDragReject ? (
              <p className="text-red-600 dark:text-red-400 font-medium">
                File type not supported
              </p>
            ) : isDragActive ? (
              <p className="text-blue-600 dark:text-blue-400 font-medium">
                Drop your JSON file here
              </p>
            ) : (
              <div>
                <p className="font-medium">
                  Drop your JSON file here, or click to select
                </p>
                <p className="text-sm">
                  Supports .json, .txt, .js files (max 10MB)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={handlePaste}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>Paste from Clipboard</span>
        </button>

        {errors.length > 0 && (
          <button
            onClick={handleAutoFix}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
            <span>Auto Fix</span>
          </button>
        )}

        <button
          onClick={handleClear}
          disabled={!state.inputText}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Clear</span>
        </button>

        {state.validationResult?.isValid && (
          <>
            <button
              onClick={toggleFormattedView}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                state.showFormatted 
                  ? 'bg-purple-600 text-white hover:bg-purple-700' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
              data-tour="format-button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{state.showFormatted ? 'Hide Formatted' : 'Show Formatted'}</span>
            </button>

            <button
              onClick={handleFormat}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>Format</span>
            </button>

            <button
              onClick={handleCopyFormatted}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy Formatted</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download</span>
            </button>
          </>
        )}
      </div>

      {/* Error Navigation */}
      {(errors.length > 0 || warnings.length > 0) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4" data-tour="validation-results">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800 dark:text-red-200 font-medium">
                {errors.length} {errors.length === 1 ? 'Error' : 'Errors'}
                {warnings.length > 0 && `, ${warnings.length} ${warnings.length === 1 ? 'Warning' : 'Warnings'}`}
                {state.validationResult?.schemaValidation && !state.validationResult.schemaValidation.isValid && 
                  <span className="ml-2 text-xs bg-red-100 dark:bg-red-800 px-2 py-1 rounded">Schema Failed</span>
                }
              </span>
            </div>
            
            {errors.length > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => goToError(Math.max(0, state.currentErrorIndex - 1))}
                  disabled={state.currentErrorIndex === 0}
                  className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm text-red-700 dark:text-red-300">
                  {state.currentErrorIndex + 1} of {errors.length}
                </span>
                <button
                  onClick={() => goToError(Math.min(errors.length - 1, state.currentErrorIndex + 1))}
                  disabled={state.currentErrorIndex === errors.length - 1}
                  className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          {/* Error List */}
          <div className="space-y-2">
            {state.validationResult?.errors.map((error, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  error.severity === 'error'
                    ? 'bg-red-100 dark:bg-red-800/30 hover:bg-red-200 dark:hover:bg-red-800/50'
                    : 'bg-yellow-100 dark:bg-yellow-800/30 hover:bg-yellow-200 dark:hover:bg-yellow-800/50'
                } ${index === state.currentErrorIndex ? 'ring-2 ring-red-500' : ''}`}
                onClick={() => goToError(index)}
              >
                <div className="flex items-start space-x-2">
                  <svg 
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      error.severity === 'error' 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className={`text-sm font-medium ${
                        error.severity === 'error'
                          ? 'text-red-800 dark:text-red-200'
                          : 'text-yellow-800 dark:text-yellow-200'
                      }`}>
                        {error.message}
                      </p>
                      {error.source === 'schema' && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                          Schema
                        </span>
                      )}
                    </div>
                    {(error.lineNumber || error.columnNumber || error.instancePath) && (
                      <p className={`text-xs mt-1 ${
                        error.severity === 'error'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {error.lineNumber && (
                          <button
                            onClick={() => goToError(index)}
                            className="hover:underline cursor-pointer font-semibold"
                            title="Click to jump to this line"
                          >
                            Line {error.lineNumber}
                          </button>
                        )}
                        {error.lineNumber && error.columnNumber && ', '}
                        {error.columnNumber && (
                          <span className="font-semibold">Column {error.columnNumber}</span>
                        )}
                        {error.instancePath && error.instancePath !== '/' && ` • Path: ${error.instancePath}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              JSON Input
            </h2>
            {state.fileName && (
              <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                File: {state.fileName}
              </span>
            )}
          </div>
          
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={state.inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Paste your JSON here or drag and drop a file..."
              className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              spellCheck={false}
            />
            
            {state.isLoading && (
              <div className="absolute inset-0 bg-white/75 dark:bg-gray-800/75 flex items-center justify-center rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600 dark:text-gray-400">Processing...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {state.validationResult?.isValid ? 'Formatted JSON' : 'Validation Results'}
            </h2>
            {state.validationResult?.isValid && state.showFormatted && (
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Syntax Highlighted</span>
              </div>
            )}
          </div>
          
          {!state.validationResult && !state.inputText && (
            <div className="h-96 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="font-medium">Enter JSON to see validation results</p>
                <p className="text-sm mt-1">Drag & drop files, paste text, or type directly</p>
              </div>
            </div>
          )}

          {state.validationResult?.isValid && (
            <div className="space-y-4">
              {/* Success Message */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-800 dark:text-green-200 font-medium">
                      Valid JSON
                      {state.validationResult.schemaValidation?.isValid && state.enableSchemaValidation && (
                        <span className="ml-2 text-xs bg-green-100 dark:bg-green-800 px-2 py-1 rounded">
                          Schema Valid
                        </span>
                      )}
                    </span>
                  </div>
                  {state.validationResult.stats && (
                    <div className="text-xs text-green-700 dark:text-green-300">
                      Depth: {state.validationResult.stats.depth}
                    </div>
                  )}
                </div>
              </div>

              {/* Formatted JSON Display */}
              <div className="relative">
                <div className="h-80 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  {state.showFormatted && state.validationResult.formattedJSON ? (
                    <SyntaxHighlighter
                      language="json"
                      style={state.isDarkMode ? tomorrow : prism}
                      customStyle={{
                        margin: 0,
                        height: '100%',
                        fontSize: '13px',
                        lineHeight: '1.4'
                      }}
                      showLineNumbers
                      wrapLines
                    >
                      {state.validationResult.formattedJSON}
                    </SyntaxHighlighter>
                  ) : (
                    <pre className="h-full p-4 bg-gray-50 dark:bg-gray-900 overflow-auto text-sm font-mono text-gray-900 dark:text-white whitespace-pre-wrap">
                      {state.validationResult.formattedJSON}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}

          {state.validationResult?.isValid === false && (
            <div className="space-y-4">
              {/* Error placeholder for formatted view */}
              <div className="h-80 border border-red-300 dark:border-red-600 rounded-lg bg-red-50/50 dark:bg-red-900/10 flex items-center justify-center">
                <div className="text-center text-red-500 dark:text-red-400 max-w-sm">
                  <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium mb-2">Cannot format invalid JSON</p>
                  <p className="text-sm">Fix the errors shown above to see formatted output</p>
                  <div className="mt-4 p-3 bg-red-100 dark:bg-red-800/30 rounded-lg text-left">
                    <p className="text-xs font-mono text-red-700 dark:text-red-300">
                      {errors.length} error{errors.length !== 1 ? 's' : ''} found
                      {warnings.length > 0 && `, ${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Stats/Info Footer */}
      {state.inputText && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
            {/* Basic Stats */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {state.inputText.length.toLocaleString()}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Characters</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {state.inputText.split('\n').length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Lines</div>
            </div>

            {/* JSON-specific stats */}
            {state.validationResult?.isValid && state.validationResult.stats && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {state.validationResult.stats.objects}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Objects</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {state.validationResult.stats.arrays}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Arrays</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {state.validationResult.stats.properties}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Properties</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {state.validationResult.stats.depth}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Max Depth</div>
                </div>
              </>
            )}

            {/* Error/Warning Stats */}
            {state.validationResult && !state.validationResult.isValid && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {errors.length}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Errors</div>
                </div>
                
                {warnings.length > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {warnings.length}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Warnings</div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* File size information */}
          {state.inputText && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
              <span>
                File size: {new Blob([state.inputText]).size} bytes
                {state.validationResult?.formattedJSON && (
                  <> • Formatted size: {new Blob([state.validationResult.formattedJSON]).size} bytes</>
                )}
                {state.enableSchemaValidation && state.schemaText && (
                  <> • Schema size: {new Blob([state.schemaText]).size} bytes</>
                )}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          JSON Validation Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
          <ul className="space-y-1">
            <li>• Use double quotes for strings, not single quotes</li>
            <li>• Remove trailing commas before closing brackets</li>
            <li>• Ensure all brackets and braces are properly closed</li>
            <li>• Property names must be quoted strings</li>
          </ul>
          <ul className="space-y-1">
            <li>• Use 'null' for null values, not 'undefined'</li>
            <li>• Numbers cannot have leading zeros (except 0.x)</li>
            <li>• Enable schema validation for structure validation</li>
            <li>• Use templates for common JSON structures</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default JSONValidator;