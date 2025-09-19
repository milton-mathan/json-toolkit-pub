// src/components/json-generator/JSONPreview.tsx
import React, { useState, useMemo, memo } from 'react';
import { jsonUtils } from '../../utils/json';
import { fileUtils } from '../../utils/file';
import { performanceUtils } from '../../utils/performance';

interface JSONPreviewProps {
  json: object;
  hasValidFields: boolean;
  hasErrors: boolean;
}

const JSONPreview: React.FC<JSONPreviewProps> = ({
  json,
  hasValidFields,
  hasErrors
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [indentSize, setIndentSize] = useState(2);

  // Calculate JSON statistics with performance measurement
  const jsonStats = useMemo(() => {
    if (!hasValidFields) return null;

    return performanceUtils.measurePerformance('JSON Stats Calculation', () => {
      const jsonString = JSON.stringify(json);
      const formattedString = jsonUtils.formatJSON(json, indentSize);
      
      const countDepth = (obj: unknown, currentDepth = 0): number => {
        if (typeof obj !== 'object' || obj === null) return currentDepth;
        
        let maxDepth = currentDepth;
        if (Array.isArray(obj)) {
          obj.forEach(item => {
            maxDepth = Math.max(maxDepth, countDepth(item, currentDepth + 1));
          });
        } else {
          Object.values(obj).forEach(value => {
            maxDepth = Math.max(maxDepth, countDepth(value, currentDepth + 1));
          });
        }
        return maxDepth;
      };

      const countProperties = (obj: unknown): number => {
        if (typeof obj !== 'object' || obj === null) return 0;
        
        let count = 0;
        if (Array.isArray(obj)) {
          count += obj.length;
          obj.forEach(item => {
            count += countProperties(item);
          });
        } else {
          count += Object.keys(obj).length;
          Object.values(obj).forEach(value => {
            count += countProperties(value);
          });
        }
        return count;
      };

      return {
        size: jsonString.length,
        formattedSize: formattedString.length,
        lines: formattedString.split('\n').length,
        properties: Object.keys(json).length,
        totalProperties: countProperties(json),
        maxDepth: countDepth(json),
        formatted: formattedString
      };
    });
  }, [json, hasValidFields, indentSize]);

  const handleCopy = async () => {
    if (!jsonStats) return;
    
    const success = await fileUtils.copyToClipboard(jsonStats.formatted);
    
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownload = () => {
    if (Object.keys(json).length > 0) {
      fileUtils.downloadJSON(json, 'generated.json');
    }
  };

  const getStatusDisplay = () => {
    if (hasErrors) {
      return (
        <div className="text-red-600 dark:text-red-400 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Please fix the errors above
        </div>
      );
    }
    
    if (hasValidFields) {
      return (
        <div className="text-green-600 dark:text-green-400 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Valid JSON generated
          {jsonStats && jsonStats.maxDepth > 0 && (
            <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
              {jsonStats.maxDepth} levels deep
            </span>
          )}
        </div>
      );
    }
    
    return (
      <div className="text-gray-500 dark:text-gray-400 flex items-center">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Start by adding some fields
      </div>
    );
  };

  const getPreviewContent = () => {
    if (hasValidFields && jsonStats) {
      return jsonStats.formatted;
    }
    
    return '{\n  // Add fields to generate JSON\n  // Use object/array types for nested structures\n}';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Generated JSON
        </h2>
        <div className="flex items-center space-x-2">
          {/* Indentation Control */}
          {hasValidFields && (
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Indent:
              </label>
              <select
                value={indentSize}
                onChange={(e) => setIndentSize(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
                <option value={0}>Minified</option>
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div data-tour="export-buttons">
            <button
              onClick={handleCopy}
              disabled={!hasValidFields}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                copySuccess
                  ? 'bg-green-600 text-white'
                  : hasValidFields
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
              }`}
              title={copySuccess ? 'Copied!' : 'Copy to clipboard'}
            >
              {copySuccess ? (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </span>
              )}
            </button>
            <button
              onClick={handleDownload}
              disabled={!hasValidFields}
              className={`ml-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                hasValidFields
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
              }`}
              title="Download JSON file"
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* JSON Display */}
      <div className="bg-gray-900 rounded-lg p-4 min-h-96 overflow-auto">
        <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
          {getPreviewContent()}
        </pre>
      </div>

      {/* Status Display */}
      <div className="text-sm">
        {getStatusDisplay()}
      </div>

      {/* Enhanced JSON Statistics */}
      {hasValidFields && jsonStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="font-medium text-gray-900 dark:text-white">Size</div>
            <div>{jsonStats.size} chars</div>
            <div className="text-gray-500">({jsonStats.formattedSize} formatted)</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="font-medium text-gray-900 dark:text-white">Properties</div>
            <div>{jsonStats.properties} root</div>
            <div className="text-gray-500">({jsonStats.totalProperties} total)</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="font-medium text-gray-900 dark:text-white">Structure</div>
            <div>{jsonStats.maxDepth} levels deep</div>
            <div className="text-gray-500">{jsonStats.lines} lines</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="font-medium text-gray-900 dark:text-white">Format</div>
            <div>{indentSize > 0 ? `${indentSize} space indent` : 'Minified'}</div>
            <div className="text-gray-500">Valid JSON</div>
          </div>
        </div>
      )}

      {/* Helpful Tips for Nested Structures */}
      {!hasValidFields && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            💡 Tips for creating nested JSON:
          </h3>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Set field type to "Object" or "Array" to create nested structures</li>
            <li>• Click the + button next to nested fields to add children</li>
            <li>• Use the collapse/expand arrows to manage complex structures</li>
            <li>• Child fields are automatically included in the parent object/array</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default memo(JSONPreview, (prevProps, nextProps) => {
  return (
    performanceUtils.deepEqual(prevProps.json, nextProps.json) &&
    prevProps.hasValidFields === nextProps.hasValidFields &&
    prevProps.hasErrors === nextProps.hasErrors
  );
});