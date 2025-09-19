// src/components/csv-converter/CSVConverter.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { fileUtils } from '../../utils/file';
import { storage } from '../../utils/localStorage';

interface CSVData {
  headers: string[];
  rows: string[][];
  meta: Papa.ParseMeta;
}

interface ConversionOptions {
  delimiter: string;
  hasHeaders: boolean;
  outputFormat: 'array-of-objects' | 'object-with-arrays' | 'nested';
  dataTypes: { [column: string]: 'string' | 'number' | 'boolean' | 'date' | 'auto' };
  includeEmptyValues: boolean;
  selectedColumns: string[];
}

interface ConversionResult {
  json: Record<string, unknown>[] | Record<string, unknown>;
  formattedJSON: string;
  stats: {
    totalRows: number;
    totalColumns: number;
    processedRows: number;
    skippedRows: number;
  };
}

interface CSVConverterState {
  csvData: CSVData | null;
  conversionOptions: ConversionOptions;
  conversionResult: ConversionResult | null;
  isLoading: boolean;
  fileName?: string;
  errors: string[];
  showPreview: boolean;
  showFormatted: boolean;
  isDarkMode: boolean;
  showOptionsPanel: boolean;
}

const CSVConverter: React.FC = () => {
  const [state, setState] = useState<CSVConverterState>({
    csvData: null,
    conversionOptions: {
      delimiter: ',',
      hasHeaders: true,
      outputFormat: 'array-of-objects',
      dataTypes: {},
      includeEmptyValues: false,
      selectedColumns: []
    },
    conversionResult: null,
    isLoading: false,
    errors: [],
    showPreview: false,
    showFormatted: false,
    isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    showOptionsPanel: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved preferences on mount
  useEffect(() => {
    const savedOptions = storage.get('csv-converter-options', {});
    if (Object.keys(savedOptions).length > 0) {
      setState(prev => ({
        ...prev,
        conversionOptions: { ...prev.conversionOptions, ...savedOptions }
      }));
    }
  }, []);

  // Listen for global shortcut events
  useEffect(() => {
    const handleGlobalShortcut = (e: CustomEvent) => {
      const { action } = e.detail;
      
      switch (action) {
        case 'clear-input':
          setState(prev => ({ 
            ...prev, 
            csvData: null, 
            conversionResult: null, 
            fileName: undefined,
            errors: []
          }));
          break;
        case 'convert-csv':
          if (state.csvData) {
            convertToJSON(state.csvData, state.conversionOptions);
          }
          break;
        case 'copy-output':
          if (state.conversionResult?.formattedJSON) {
            navigator.clipboard.writeText(state.conversionResult.formattedJSON);
          }
          break;
        case 'save-file':
          if (state.conversionResult?.formattedJSON) {
            const blob = new Blob([state.conversionResult.formattedJSON], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'converted.json';
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
  }, [state.csvData, state.conversionResult, state.conversionOptions]);

  // Auto-detect delimiter from CSV content
  const detectDelimiter = useCallback((csvContent: string): string => {
    const delimiters = [',', ';', '\t', '|'];
    const sampleLines = csvContent.split('\n').slice(0, 5).join('\n');
    
    let bestDelimiter = ',';
    let maxColumns = 0;
    
    for (const delimiter of delimiters) {
      const result = Papa.parse(sampleLines, { delimiter });
      if (result.data.length > 0) {
        const avgColumns = result.data.reduce((sum: number, row: string[]) => sum + row.length, 0) / result.data.length;
        if (avgColumns > maxColumns) {
          maxColumns = avgColumns;
          bestDelimiter = delimiter;
        }
      }
    }
    
    return bestDelimiter;
  }, []);

  // Parse CSV content
  const parseCSV = useCallback((content: string, options?: Partial<ConversionOptions>) => {
    setState(prev => ({ ...prev, isLoading: true, errors: [] }));

    try {
      const delimiter = options?.delimiter || detectDelimiter(content);
      const hasHeaders = options?.hasHeaders ?? true;

      Papa.parse(content, {
        delimiter,
        header: false,
        skipEmptyLines: true,
        transform: (value) => value.trim(),
        complete: (results) => {
          if (results.errors.length > 0) {
            const errorMessages = results.errors.map(err => `Row ${err.row}: ${err.message}`);
            setState(prev => ({
              ...prev,
              errors: errorMessages,
              isLoading: false
            }));
            return;
          }

          const data = results.data as string[][];
          let headers: string[];
          let rows: string[][];

          if (hasHeaders && data.length > 0) {
            headers = data[0];
            rows = data.slice(1);
          } else {
            headers = data.length > 0 ? data[0].map((_, index) => `Column ${index + 1}`) : [];
            rows = data;
          }

          // Auto-detect data types for each column
          const detectedTypes: { [column: string]: 'string' | 'number' | 'boolean' | 'date' | 'auto' } = {};
          headers.forEach((header, index) => {
            const columnValues = rows.map(row => row[index]).filter(val => val && val.trim());
            detectedTypes[header] = detectDataType(columnValues);
          });

          const csvData: CSVData = {
            headers,
            rows,
            meta: results.meta
          };

          setState(prev => ({
            ...prev,
            csvData,
            conversionOptions: {
              ...prev.conversionOptions,
              delimiter,
              hasHeaders,
              dataTypes: detectedTypes,
              selectedColumns: headers
            },
            isLoading: false,
            showPreview: true
          }));

          // Automatically convert to JSON
          convertToJSON(csvData, {
            ...state.conversionOptions,
            delimiter,
            hasHeaders,
            dataTypes: detectedTypes,
            selectedColumns: headers
          });
        }
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        errors: [`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`],
        isLoading: false
      }));
    }
  }, [detectDelimiter]);

  // Detect data type from sample values
  const detectDataType = useCallback((values: string[]): 'string' | 'number' | 'boolean' | 'date' => {
    if (values.length === 0) return 'string';

    const sample = values.slice(0, 10); // Check first 10 non-empty values
    
    // Check for boolean
    const booleanValues = sample.filter(val => 
      ['true', 'false', 'yes', 'no', '1', '0'].includes(val.toLowerCase())
    );
    if (booleanValues.length / sample.length > 0.8) return 'boolean';

    // Check for numbers
    const numericValues = sample.filter(val => !isNaN(Number(val)) && val.trim() !== '');
    if (numericValues.length / sample.length > 0.8) return 'number';

    // Check for dates
    const dateValues = sample.filter(val => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && val.includes('-') || val.includes('/');
    });
    if (dateValues.length / sample.length > 0.6) return 'date';

    return 'string';
  }, []);

  // Convert CSV data to JSON
  const convertToJSON = useCallback((csvData: CSVData, options: ConversionOptions) => {
    if (!csvData) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { headers, rows } = csvData;
      const { outputFormat, dataTypes, includeEmptyValues, selectedColumns } = options;

      // Filter selected columns
      const selectedIndices = selectedColumns.map(col => headers.indexOf(col)).filter(idx => idx !== -1);
      const filteredHeaders = selectedIndices.map(idx => headers[idx]);

      let result: Record<string, unknown>[] | Record<string, unknown>;
      let processedRows = 0;
      let skippedRows = 0;

      switch (outputFormat) {
        case 'array-of-objects':
          result = rows.map(row => {
            const obj: Record<string, unknown> = {};
            let hasValue = false;

            selectedIndices.forEach((colIndex, i) => {
              const header = filteredHeaders[i];
              const value = row[colIndex] || '';
              
              if (value.trim() || includeEmptyValues) {
                obj[header] = convertValue(value, dataTypes[header] || 'string');
                hasValue = true;
              }
            });

            if (hasValue) {
              processedRows++;
              return obj;
            } else {
              skippedRows++;
              return null;
            }
          }).filter(obj => obj !== null);
          break;

        case 'object-with-arrays':
          result = {};
          filteredHeaders.forEach((header, i) => {
            const colIndex = selectedIndices[i];
            result[header] = rows.map(row => {
              const value = row[colIndex] || '';
              return convertValue(value, dataTypes[header] || 'string');
            });
          });
          processedRows = rows.length;
          break;

        case 'nested':
          // Try to create nested structure based on dot notation in headers
          result = rows.map(row => {
            const obj: Record<string, unknown> = {};
            
            selectedIndices.forEach((colIndex, i) => {
              const header = filteredHeaders[i];
              const value = row[colIndex] || '';
              
              if (value.trim() || includeEmptyValues) {
                setNestedProperty(obj, header, convertValue(value, dataTypes[header] || 'string'));
              }
            });

            processedRows++;
            return obj;
          });
          break;
      }

      const formattedJSON = JSON.stringify(result, null, 2);
      
      const conversionResult: ConversionResult = {
        json: result,
        formattedJSON,
        stats: {
          totalRows: rows.length,
          totalColumns: headers.length,
          processedRows,
          skippedRows
        }
      };

      setState(prev => ({
        ...prev,
        conversionResult,
        isLoading: false
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        errors: [`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        isLoading: false
      }));
    }
  }, []);

  // Convert value based on detected/selected type
  const convertValue = useCallback((value: string, type: string): string | number | boolean | Date => {
    if (!value.trim()) return value;

    switch (type) {
      case 'number': {
        const num = Number(value);
        return isNaN(num) ? value : num;
      }
      case 'boolean': {
        const lower = value.toLowerCase();
        if (['true', 'yes', '1'].includes(lower)) return true;
        if (['false', 'no', '0'].includes(lower)) return false;
        return value;
      }
      case 'date': {
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date.toISOString();
      }
      default:
        return value;
    }
  }, []);

  // Set nested property using dot notation
  const setNestedProperty = useCallback((obj: Record<string, unknown>, path: string, value: unknown) => {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }, []);

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setState(prev => ({ ...prev, isLoading: true, fileName: file.name }));

    try {
      const content = await fileUtils.readFileAsText(file);
      parseCSV(content);
    } catch (error) {
      setState(prev => ({
        ...prev,
        errors: [`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        isLoading: false
      }));
    }
  }, [parseCSV]);

  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.csv']
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024 // 50MB limit for CSV files
  });

  // Handle paste from clipboard
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      parseCSV(text);
    } catch {
      setState(prev => ({
        ...prev,
        errors: ['Failed to read from clipboard. Please check browser permissions.']
      }));
    }
  }, [parseCSV]);

  // Update conversion options
  const updateOptions = useCallback((updates: Partial<ConversionOptions>) => {
    const newOptions = { ...state.conversionOptions, ...updates };
    setState(prev => ({ ...prev, conversionOptions: newOptions }));
    storage.set('csv-converter-options', newOptions);

    // Re-convert if we have data
    if (state.csvData) {
      convertToJSON(state.csvData, newOptions);
    }
  }, [state.conversionOptions, state.csvData, convertToJSON]);

  // Toggle column selection
  const toggleColumn = useCallback((column: string) => {
    const newSelected = state.conversionOptions.selectedColumns.includes(column)
      ? state.conversionOptions.selectedColumns.filter(col => col !== column)
      : [...state.conversionOptions.selectedColumns, column];
    
    updateOptions({ selectedColumns: newSelected });
  }, [state.conversionOptions.selectedColumns, updateOptions]);

  // Clear all data
  const handleClear = useCallback(() => {
    setState(prev => ({
      ...prev,
      csvData: null,
      conversionResult: null,
      fileName: undefined,
      errors: [],
      showPreview: false
    }));
  }, []);

  // Export functions
  const handleCopyJSON = useCallback(async () => {
    if (state.conversionResult?.formattedJSON) {
      await fileUtils.copyToClipboard(state.conversionResult.formattedJSON);
    }
  }, [state.conversionResult?.formattedJSON]);

  const handleDownloadJSON = useCallback(() => {
    if (state.conversionResult?.json) {
      const fileName = state.fileName?.replace(/\.[^/.]+$/, '') + '_converted.json' || 'converted.json';
      fileUtils.downloadJSON(state.conversionResult.json, fileName);
    }
  }, [state.conversionResult?.json, state.fileName]);


  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          CSV to JSON Converter
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Convert CSV files to JSON with customizable structure and data types
        </p>
      </div>

      {/* File Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragActive && !isDragReject
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-102'
            : isDragReject
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }
        `}
        data-tour="file-upload"
      >
        <input {...getInputProps()} ref={fileInputRef} />
        <div className="space-y-3">
          <svg
            className={`mx-auto h-16 w-16 ${isDragReject ? 'text-red-400' : 'text-gray-400'}`}
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M8 18V8a2 2 0 012-2h4l2 2h12a2 2 0 012 2v8m-12 0v12m8-6l-4-4-4 4m8 0H8a2 2 0 00-2 2v12a2 2 0 002 2h32a2 2 0 002-2V20a2 2 0 00-2-2z"
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
              <p className="text-blue-600 dark:text-blue-400 font-medium text-lg">
                Drop your CSV file here
              </p>
            ) : (
              <div>
                <p className="font-medium text-lg mb-2">
                  Drop your CSV file here, or click to select
                </p>
                <p className="text-sm">
                  Supports .csv, .txt files (max 50MB)
                </p>
                <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
                  Automatically detects delimiters: comma, semicolon, tab, pipe
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={handlePaste}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>Paste CSV Data</span>
        </button>

        <button
          onClick={() => setState(prev => ({ ...prev, showOptionsPanel: !prev.showOptionsPanel }))}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
            state.showOptionsPanel
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          }`}
          data-tour="csv-options"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
          <span>{state.showOptionsPanel ? 'Hide Options' : 'Show Options'}</span>
        </button>

        <button
          onClick={handleClear}
          disabled={!state.csvData}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Clear</span>
        </button>

        {state.conversionResult && (
          <>
            <button
              onClick={handleCopyJSON}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy JSON</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download JSON</span>
            </button>

          </>
        )}
      </div>

      {/* Errors */}
      {state.errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800 dark:text-red-200 font-medium">
              {state.errors.length} {state.errors.length === 1 ? 'Error' : 'Errors'}
            </span>
          </div>
          <ul className="space-y-1">
            {state.errors.map((error, index) => (
              <li key={index} className="text-sm text-red-700 dark:text-red-300">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Conversion Options Panel */}
      {state.showOptionsPanel && state.csvData && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Conversion Options
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Options */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Basic Settings</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Delimiter
                </label>
                <select
                  value={state.conversionOptions.delimiter}
                  onChange={(e) => updateOptions({ delimiter: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value="\t">Tab (\t)</option>
                  <option value="|">Pipe (|)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Output Format
                </label>
                <select
                  value={state.conversionOptions.outputFormat}
                  onChange={(e) => updateOptions({ outputFormat: e.target.value as 'array-of-objects' | 'object-with-arrays' | 'nested' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="array-of-objects">Array of Objects</option>
                  <option value="object-with-arrays">Object with Arrays</option>
                  <option value="nested">Nested Structure</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.conversionOptions.hasHeaders}
                    onChange={(e) => updateOptions({ hasHeaders: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">First row contains headers</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.conversionOptions.includeEmptyValues}
                    onChange={(e) => updateOptions({ includeEmptyValues: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Include empty values</span>
                </label>
              </div>
            </div>

            {/* Column Selection */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Column Selection</h4>
              <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-300 dark:border-gray-600 rounded-md p-3">
                {state.csvData.headers.map((header, index) => (
                  <label key={index} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.conversionOptions.selectedColumns.includes(header)}
                      onChange={() => toggleColumn(header)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {header || `Column ${index + 1}`}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({state.conversionOptions.dataTypes[header] || 'string'})
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => updateOptions({ selectedColumns: state.csvData!.headers })}
                  className="flex-1 px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-700"
                >
                  Select All
                </button>
                <button
                  onClick={() => updateOptions({ selectedColumns: [] })}
                  className="flex-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Select None
                </button>
              </div>
            </div>

            {/* Data Types */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Data Types</h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {state.conversionOptions.selectedColumns.map((header) => (
                  <div key={header} className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300 w-24 truncate" title={header}>
                      {header}:
                    </span>
                    <select
                      value={state.conversionOptions.dataTypes[header] || 'string'}
                      onChange={(e) => updateOptions({
                        dataTypes: {
                          ...state.conversionOptions.dataTypes,
                          [header]: e.target.value as 'string' | 'number' | 'boolean' | 'date' | 'auto'
                        }
                      })}
                      className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="date">Date</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" data-tour="preview-section">
        {/* CSV Preview */}
        {state.csvData && state.showPreview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                CSV Preview
              </h2>
              {state.fileName && (
                <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                  File: {state.fileName}
                </span>
              )}
            </div>
            
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {state.csvData.headers.map((header, index) => (
                      <th
                        key={index}
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {header || `Column ${index + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {state.csvData.rows.slice(0, 10).map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-3 py-2 text-sm text-gray-900 dark:text-white max-w-xs truncate"
                          title={cell}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {state.csvData.rows.length > 10 && (
                <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                  Showing first 10 rows of {state.csvData.rows.length} total rows
                </div>
              )}
            </div>
          </div>
        )}

        {/* JSON Output */}
        {state.conversionResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                JSON Output
              </h2>
              <button
                onClick={() => setState(prev => ({ ...prev, showFormatted: !prev.showFormatted }))}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  state.showFormatted
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {state.showFormatted ? 'Hide Formatting' : 'Show Formatting'}
              </button>
            </div>

            {/* Conversion Stats */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {state.conversionResult.stats.processedRows}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {state.conversionOptions.selectedColumns.length}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Columns</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {state.conversionResult.formattedJSON.length}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Characters</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    {new Blob([state.conversionResult.formattedJSON]).size}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Bytes</div>
                </div>
              </div>
            </div>

            <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <div className="h-80 overflow-auto">
                {state.showFormatted ? (
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
                    {state.conversionResult.formattedJSON}
                  </SyntaxHighlighter>
                ) : (
                  <pre className="h-full p-4 bg-gray-50 dark:bg-gray-900 text-sm font-mono text-gray-900 dark:text-white whitespace-pre-wrap">
                    {state.conversionResult.formattedJSON}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {state.isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-900 dark:text-white">Processing CSV...</span>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          CSV Conversion Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
          <ul className="space-y-1">
            <li>• <strong>Array of Objects:</strong> Each CSV row becomes a JSON object</li>
            <li>• <strong>Object with Arrays:</strong> Each column becomes an array of values</li>
            <li>• <strong>Nested Structure:</strong> Use dot notation in headers (e.g., user.name)</li>
          </ul>
          <ul className="space-y-1">
            <li>• Auto-detects data types: numbers, booleans, dates</li>
            <li>• Supports multiple delimiters: comma, semicolon, tab, pipe</li>
            <li>• Large file support up to 50MB</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CSVConverter;