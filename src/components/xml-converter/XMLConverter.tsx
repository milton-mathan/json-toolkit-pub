// src/components/xml-converter/XMLConverter.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { fileUtils } from '../../utils/file';

interface XMLData {
  content: string;
  size: number;
}

interface ConversionOptions {
  ignoreAttributes: boolean;
  ignoreText: boolean;
  ignoreComment: boolean;
  ignoreDoctype: boolean;
  ignoreCdata: boolean;
  trimValues: boolean;
  sanitizeTagNames: boolean;
  arrayMode: 'auto' | 'strict' | 'never';
  numberParseOptions: {
    hex: boolean;
    leadingZeros: boolean;
  };
  attributePrefix: string;
  textKey: string;
}

interface ConversionResult {
  json: Record<string, unknown> | Record<string, unknown>[];
  formattedJSON: string;
  stats: {
    totalElements: number;
    totalAttributes: number;
    processedElements: number;
    depth: number;
  };
}

interface XMLConverterState {
  xmlData: XMLData | null;
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

const XMLConverter: React.FC = () => {
  const [state, setState] = useState<XMLConverterState>({
    xmlData: null,
    conversionOptions: {
      ignoreAttributes: false,
      ignoreText: false,
      ignoreComment: true,
      ignoreDoctype: true,
      ignoreCdata: false,
      trimValues: true,
      sanitizeTagNames: true,
      arrayMode: 'auto',
      numberParseOptions: {
        hex: false,
        leadingZeros: true,
      },
      attributePrefix: '@',
      textKey: '#text',
    },
    conversionResult: null,
    isLoading: false,
    fileName: undefined,
    errors: [],
    showPreview: true,
    showFormatted: true,
    isDarkMode: false,
    showOptionsPanel: false,
  });


  // Simple XML to JSON parser (basic implementation)
  const parseXMLToJSON = useCallback((xmlString: string, options: ConversionOptions): Record<string, unknown> => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.getElementsByTagName('parsererror')[0];
    if (parserError) {
      throw new Error('Invalid XML: ' + parserError.textContent);
    }

    const convertNode = (node: Node): unknown => {
      const result: Record<string, unknown> = {};
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;

        // Handle attributes
        if (!options.ignoreAttributes && element.attributes.length > 0) {
          for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            result[options.attributePrefix + attr.name] = attr.value;
          }
        }

        // Handle child nodes
        const childElements: Record<string, unknown[]> = {};
        let textContent = '';

        for (let i = 0; i < node.childNodes.length; i++) {
          const child = node.childNodes[i];
          
          if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent?.trim() || '';
            if (text && !options.ignoreText) {
              textContent += text;
            }
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const childElement = child as Element;
            const childTagName = options.sanitizeTagNames ? 
              childElement.tagName.toLowerCase().replace(/[^a-z0-9]/g, '_') : 
              childElement.tagName;
            
            const childResult = convertNode(child);
            
            if (!childElements[childTagName]) {
              childElements[childTagName] = [];
            }
            childElements[childTagName].push(childResult);
          } else if (child.nodeType === Node.COMMENT_NODE && !options.ignoreComment) {
            // Handle comments if needed
          } else if (child.nodeType === Node.CDATA_SECTION_NODE && !options.ignoreCdata) {
            textContent += child.textContent || '';
          }
        }

        // Add text content
        if (textContent && !options.ignoreText) {
          result[options.textKey] = options.trimValues ? textContent.trim() : textContent;
        }

        // Add child elements
        Object.entries(childElements).forEach(([childTagName, childArray]) => {
          if (options.arrayMode === 'strict' || (options.arrayMode === 'auto' && childArray.length > 1)) {
            result[childTagName] = childArray;
          } else {
            result[childTagName] = childArray[0];
          }
        });

        return Object.keys(result).length === 0 ? textContent || null : result;
      }
      
      return null;
    };

    return convertNode(xmlDoc.documentElement) as Record<string, unknown>;
  }, []);

  const convertToJSON = useCallback((xmlData: XMLData, options: ConversionOptions) => {
    setState(prev => ({ ...prev, isLoading: true, errors: [] }));

    try {
      const startTime = performance.now();
      
      // Parse XML
      const jsonResult = parseXMLToJSON(xmlData.content, options);
      
      // Calculate stats
      const calculateStats = (obj: unknown, depth = 0): { elements: number; attributes: number; maxDepth: number } => {
        let elements = 0;
        let attributes = 0;
        let maxDepth = depth;

        if (typeof obj === 'object' && obj !== null) {
          const record = obj as Record<string, unknown>;
          Object.entries(record).forEach(([key, value]) => {
            if (key.startsWith(options.attributePrefix)) {
              attributes++;
            } else {
              elements++;
              if (typeof value === 'object' && value !== null) {
                const childStats = calculateStats(value, depth + 1);
                elements += childStats.elements;
                attributes += childStats.attributes;
                maxDepth = Math.max(maxDepth, childStats.maxDepth);
              }
            }
          });
        }

        return { elements, attributes, maxDepth };
      };

      const stats = calculateStats(jsonResult);
      const formattedJSON = JSON.stringify(jsonResult, null, 2);
      
      const conversionResult: ConversionResult = {
        json: jsonResult,
        formattedJSON,
        stats: {
          totalElements: stats.elements,
          totalAttributes: stats.attributes,
          processedElements: stats.elements,
          depth: stats.maxDepth,
        },
      };

      setState(prev => ({ 
        ...prev, 
        conversionResult,
        isLoading: false,
        errors: []
      }));

      const endTime = performance.now();
      console.log(`XML conversion completed in ${endTime - startTime}ms`);

    } catch (error) {
      console.error('XML conversion error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        errors: [error instanceof Error ? error.message : 'Unknown conversion error'],
        conversionResult: null
      }));
    }
  }, [parseXMLToJSON]);

  // Auto-convert when XML data or options change
  useEffect(() => {
    if (state.xmlData && !state.isLoading) {
      const timeoutId = setTimeout(() => {
        convertToJSON(state.xmlData!, state.conversionOptions);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [state.xmlData, state.conversionOptions, convertToJSON, state.isLoading]);

  // File drop handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setState(prev => ({ ...prev, isLoading: true, errors: [] }));

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const xmlData: XMLData = {
          content,
          size: file.size,
        };
        
        setState(prev => ({
          ...prev,
          xmlData,
          fileName: file.name,
          isLoading: false,
          errors: []
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          errors: [`Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`],
          xmlData: null
        }));
      }
    };

    reader.onerror = () => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        errors: ['Failed to read file'],
        xmlData: null
      }));
    };

    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/xml': ['.xml'],
      'application/xml': ['.xml'],
      'text/plain': ['.xml']
    },
    multiple: false
  });

  // Handle manual XML input
  const handleXMLInput = useCallback((content: string) => {
    if (!content.trim()) {
      setState(prev => ({ ...prev, xmlData: null, conversionResult: null }));
      return;
    }

    const xmlData: XMLData = {
      content: content.trim(),
      size: new Blob([content]).size,
    };

    setState(prev => ({
      ...prev,
      xmlData,
      fileName: undefined,
      errors: []
    }));
  }, []);

  // Export functions
  const exportJSON = useCallback(async () => {
    if (!state.conversionResult) return;
    
    try {
      const filename = state.fileName ? 
        state.fileName.replace(/\.[^/.]+$/, '.json') : 
        'converted.json';
      
      await fileUtils.downloadJSON(
        state.conversionResult.json,
        filename
      );
    } catch (error) {
      setState(prev => ({
        ...prev,
        errors: [`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }));
    }
  }, [state.conversionResult, state.fileName]);

  const copyToClipboard = useCallback(async () => {
    if (!state.conversionResult) return;
    
    try {
      await navigator.clipboard.writeText(state.conversionResult.formattedJSON);
    } catch (error) {
      setState(prev => ({
        ...prev,
        errors: [`Copy failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }));
    }
  }, [state.conversionResult]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          XML to JSON Converter
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Convert XML files to JSON format with customizable options and formatting
        </p>
      </div>

      {/* File Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upload XML File
            </h2>
            
            {/* File Drop Zone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-2">
                <div className="text-2xl">📄</div>
                {isDragActive ? (
                  <p className="text-blue-600 dark:text-blue-400">Drop the XML file here...</p>
                ) : (
                  <>
                    <p className="text-gray-600 dark:text-gray-400">
                      Drag & drop an XML file here, or click to select
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Supports .xml files
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Manual XML Input */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Or paste XML content:
              </label>
              <textarea
                className="w-full h-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                placeholder="<root>&#10;  <item>value</item>&#10;</root>"
                onChange={(e) => handleXMLInput(e.target.value)}
              />
            </div>
          </div>

          {/* Conversion Options */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Conversion Options
              </h3>
              <button
                onClick={() => setState(prev => ({ ...prev, showOptionsPanel: !prev.showOptionsPanel }))}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {state.showOptionsPanel ? 'Hide' : 'Show'} Options
              </button>
            </div>

            {state.showOptionsPanel && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={!state.conversionOptions.ignoreAttributes}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        conversionOptions: {
                          ...prev.conversionOptions,
                          ignoreAttributes: !e.target.checked
                        }
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Include Attributes</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={state.conversionOptions.trimValues}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        conversionOptions: {
                          ...prev.conversionOptions,
                          trimValues: e.target.checked
                        }
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Trim Values</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={state.conversionOptions.ignoreComment}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        conversionOptions: {
                          ...prev.conversionOptions,
                          ignoreComment: e.target.checked
                        }
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Ignore Comments</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={state.conversionOptions.sanitizeTagNames}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        conversionOptions: {
                          ...prev.conversionOptions,
                          sanitizeTagNames: e.target.checked
                        }
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Sanitize Tag Names</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Attribute Prefix
                    </label>
                    <input
                      type="text"
                      value={state.conversionOptions.attributePrefix}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        conversionOptions: {
                          ...prev.conversionOptions,
                          attributePrefix: e.target.value
                        }
                      }))}
                      className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                      placeholder="@"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Text Content Key
                    </label>
                    <input
                      type="text"
                      value={state.conversionOptions.textKey}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        conversionOptions: {
                          ...prev.conversionOptions,
                          textKey: e.target.value
                        }
                      }))}
                      className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                      placeholder="#text"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Array Mode
                  </label>
                  <select
                    value={state.conversionOptions.arrayMode}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      conversionOptions: {
                        ...prev.conversionOptions,
                        arrayMode: e.target.value as 'auto' | 'strict' | 'never'
                      }
                    }))}
                    className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                  >
                    <option value="auto">Auto (arrays when multiple elements)</option>
                    <option value="strict">Always arrays</option>
                    <option value="never">Never arrays</option>
                  </select>
                  
                  {/* Array Mode Explanation */}
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="text-xs text-blue-800 dark:text-blue-200">
                      <div className="font-medium mb-1">Array Mode Controls:</div>
                      <div className="space-y-1">
                        <div><strong>Auto:</strong> Creates arrays only when multiple elements share the same tag name. Most efficient.</div>
                        <div><strong>Always Arrays:</strong> Wraps all elements in arrays for consistent structure.</div>
                        <div><strong>Never Arrays:</strong> Single objects only - duplicate tags overwrite previous values.</div>
                      </div>
                      
                      <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                        <div className="font-medium mb-1">Example with <code>&lt;book&gt;</code> elements:</div>
                        <div className="text-xs font-mono space-y-1">
                          <div><strong>Auto:</strong> <code>{`{"book": [obj1, obj2]}`}</code></div>
                          <div><strong>Always:</strong> <code>{`{"book": [obj1, obj2]}`}</code> (even for single)</div>
                          <div><strong>Never:</strong> <code>{`{"book": obj2}`}</code> (last one wins)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Loading State */}
          {state.isLoading && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Converting XML...</span>
              </div>
            </div>
          )}

          {/* Errors */}
          {state.errors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                Conversion Errors:
              </h3>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                {state.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Conversion Results */}
          {state.conversionResult && (
            <>
              {/* Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Conversion Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total Elements:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {state.conversionResult.stats.totalElements}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total Attributes:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {state.conversionResult.stats.totalAttributes}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Max Depth:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {state.conversionResult.stats.depth}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">File Size:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {state.xmlData ? `${(state.xmlData.size / 1024).toFixed(1)} KB` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* JSON Output */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    JSON Output
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={copyToClipboard}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Copy JSON
                    </button>
                    <button
                      onClick={exportJSON}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Download JSON
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <SyntaxHighlighter
                    language="json"
                    style={state.isDarkMode ? tomorrow : prism}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      backgroundColor: 'transparent',
                      fontSize: '0.875rem',
                    }}
                    wrapLines
                    wrapLongLines
                  >
                    {state.conversionResult.formattedJSON}
                  </SyntaxHighlighter>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default XMLConverter;