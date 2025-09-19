// src/components/json-generator/JSONGenerator.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { JSONField } from '../../types';
import { jsonUtils } from '../../utils/json';
import { storage } from '../../utils/localStorage';
import { validationUtils } from '../../utils/validation';
// import { performanceUtils } from '../../utils/performance';
import FieldInput from './FieldInput';
import JSONPreview from './JSONPreview';
import { dragDropUtils } from '../../utils/dragDrop';

const JSONGenerator: React.FC = () => {
  const [fields, setFields] = useState<JSONField[]>([
    {
      id: jsonUtils.generateId(),
      key: '',
      value: '',
      type: 'string',
      depth: 0,
      children: [],
      isCollapsed: false
    }
  ]);
  const [generatedJSON, setGeneratedJSON] = useState<object>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isCompactMode, setIsCompactMode] = useState(() => 
    storage.get('json-generator-compact-mode', false)
  );
  const [showTooltips, setShowTooltips] = useState(() => 
    storage.get('json-generator-show-tooltips', true)
  );
  const [animationsEnabled, setAnimationsEnabled] = useState(() => 
    storage.get('json-generator-animations', true)
  );
  const [showDebugPanel, setShowDebugPanel] = useState(() => 
    storage.get('json-generator-debug-panel', false)
  );
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // Debug logging for development
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Helper function to find field by ID
  const getFieldById = useCallback((id: string): JSONField | undefined => {
    const findInFields = (fieldList: JSONField[]): JSONField | undefined => {
      for (const field of fieldList) {
        if (field.id === id) return field;
        if (field.children && field.children.length > 0) {
          const found = findInFields(field.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findInFields(fields);
  }, [fields]);

  // Listen for global shortcut events
  useEffect(() => {
    const handleGlobalShortcut = (e: CustomEvent) => {
      const { action } = e.detail;
      
      switch (action) {
        case 'add-field':
          addField();
          break;
        case 'clear-input':
          clearAll();
          break;
        case 'toggle-compact':
          toggleCompactMode();
          break;
        case 'copy-output':
          // Copy the generated JSON to clipboard
          if (generatedJSON) {
            navigator.clipboard.writeText(JSON.stringify(generatedJSON, null, 2));
          }
          break;
        case 'save-file':
          // Trigger download of JSON file
          if (generatedJSON) {
            const blob = new Blob([JSON.stringify(generatedJSON, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'generated.json';
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
  }, [generatedJSON]);

  const toggleCompactMode = useCallback(() => {
    const newMode = !isCompactMode;
    setIsCompactMode(newMode);
    storage.set('json-generator-compact-mode', newMode);
  }, [isCompactMode]);

  const toggleTooltips = useCallback(() => {
    const newMode = !showTooltips;
    setShowTooltips(newMode);
    storage.set('json-generator-show-tooltips', newMode);
  }, [showTooltips]);

  const toggleAnimations = useCallback(() => {
    const newMode = !animationsEnabled;
    setAnimationsEnabled(newMode);
    storage.set('json-generator-animations', newMode);
  }, [animationsEnabled]);

  const toggleDebugPanel = useCallback(() => {
    const newMode = !showDebugPanel;
    setShowDebugPanel(newMode);
    storage.set('json-generator-debug-panel', newMode);
  }, [showDebugPanel]);

  const collapseAll = useCallback(() => {
    const updateCollapse = (fieldList: JSONField[], collapsed: boolean): JSONField[] => {
      return fieldList.map(field => ({
        ...field,
        isCollapsed: (field.type === 'object' || field.type === 'array') ? collapsed : field.isCollapsed,
        children: field.children ? updateCollapse(field.children, collapsed) : field.children
      }));
    };
    setFields(prevFields => updateCollapse(prevFields, true));
  }, []);

  const expandAll = useCallback(() => {
    const updateCollapse = (fieldList: JSONField[], collapsed: boolean): JSONField[] => {
      return fieldList.map(field => ({
        ...field,
        isCollapsed: (field.type === 'object' || field.type === 'array') ? collapsed : field.isCollapsed,
        children: field.children ? updateCollapse(field.children, collapsed) : field.children
      }));
    };
    setFields(prevFields => updateCollapse(prevFields, false));
  }, []);

  // Helper function to find the parent field of a given field ID
  const findParentField = useCallback((childId: string, fieldList: JSONField[]): JSONField | null => {
    for (const field of fieldList) {
      if (field.children) {
        if (field.children.some(child => child.id === childId)) {
          return field;
        }
        const found = findParentField(childId, field.children);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Load saved data on mount and check for CSV imports
  useEffect(() => {
    const savedFields = storage.get<JSONField[]>('json-generator-fields', []);
    if (savedFields.length > 0) {
      // Ensure all fields have the new properties for backwards compatibility
      const enhancedFields = savedFields.map(field => ({
        ...field,
        depth: field.depth ?? 0,
        children: field.children ?? [],
        isCollapsed: field.isCollapsed ?? false
      }));
      setFields(enhancedFields);
    }

  }, []);

  // Core JSON generation function with improved array handling
  const generateJSON = useCallback(() => {
    if (isDevelopment && showDebugPanel) {
      console.log('🚀 generateJSON called with fields:', fields);
    }
    
    const newErrors: { [key: string]: string } = {};
    
    const buildObject = (fieldList: JSONField[]): Record<string, unknown> => {
      if (isDevelopment && showDebugPanel) {
        console.log('🏗️ buildObject called with:', fieldList);
      }
      
      const jsonObject: Record<string, unknown> = {};
      
      fieldList.forEach((field, index) => {
        if (isDevelopment && showDebugPanel) {
          console.log(`🔍 Processing field ${index}:`, field);
        }
        
        // Skip fields with empty keys
        if (!field.key.trim()) {
          if (isDevelopment && showDebugPanel) {
            console.log(`⏭️ Skipping field ${index} - empty key`);
          }
          return;
        }

        const validation = validationUtils.validateKeyValue(field.key);
        if (!validation.isValid && validation.error) {
          if (isDevelopment && showDebugPanel) {
            console.log(`❌ Field ${index} validation failed:`, validation.error);
          }
          newErrors[field.id] = validation.error;
          return;
        }

        // Convert value based on type
        let processedValue = field.value;
        
        try {
          switch (field.type) {
            case 'number':
              processedValue = field.value === '' ? 0 : Number(field.value);
              if (isNaN(processedValue)) {
                if (isDevelopment && showDebugPanel) {
                  console.log(`❌ Field ${index} - invalid number:`, field.value);
                }
                newErrors[field.id] = 'Invalid number';
                return;
              }
              break;
              
            case 'boolean':
              processedValue = field.value === 'true' || field.value === true;
              break;
              
            case 'null':
              processedValue = null;
              break;
              
            case 'object':
              if (field.children && field.children.length > 0) {
                // Use children for nested object
                processedValue = buildObject(field.children);
              } else if (field.value && typeof field.value === 'string' && field.value.trim() && field.value !== '{}') {
                // Fallback to manual JSON input
                const parseResult = jsonUtils.parseJSON(field.value);
                if (parseResult.error) {
                  newErrors[field.id] = 'Invalid JSON object';
                  return;
                }
                processedValue = parseResult.data as Record<string, unknown>;
              } else {
                processedValue = {};
              }
              break;
              
            case 'array':
              if (field.children && field.children.length > 0) {
                // Use children for nested array - don't filter by key for arrays since indices are auto-generated
                processedValue = field.children.map(child => {
                    // Recursively process child values
                    switch (child.type) {
                      case 'number':
                        return child.value === '' ? 0 : Number(child.value);
                      case 'boolean':
                        return child.value === 'true' || child.value === true;
                      case 'null':
                        return null;
                      case 'object':
                        if (child.children && child.children.length > 0) {
                          return buildObject(child.children);
                        } else if (child.value && typeof child.value === 'string' && child.value.trim() && child.value !== '{}') {
                          const parseResult = jsonUtils.parseJSON(child.value);
                          return parseResult.error ? {} : parseResult.data;
                        }
                        return {};
                      case 'array':
                        if (child.children && child.children.length > 0) {
                          return child.children.map(grandchild => grandchild.value);
                        } else if (child.value && typeof child.value === 'string' && child.value.trim() && child.value !== '[]') {
                          const parseResult = jsonUtils.parseJSON(child.value);
                          return parseResult.error ? [] : parseResult.data;
                        }
                        return [];
                      default:
                        return String(child.value);
                    }
                  });
              } else if (field.value && typeof field.value === 'string' && field.value.trim() && field.value !== '[]') {
                // Fallback to manual JSON input
                const parseResult = jsonUtils.parseJSON(field.value);
                if (parseResult.error || !Array.isArray(parseResult.data)) {
                  newErrors[field.id] = 'Invalid JSON array';
                  return;
                }
                processedValue = parseResult.data as unknown[];
              } else {
                processedValue = [];
              }
              break;
              
            default: // string
              processedValue = String(field.value);
          }

          if (isDevelopment && showDebugPanel) {
            console.log(`✅ Field ${index} processed:`, {
              key: field.key,
              originalValue: field.value,
              processedValue: processedValue,
              type: field.type
            });
          }

          jsonObject[field.key] = processedValue;
          
        } catch (error) {
          if (isDevelopment && showDebugPanel) {
            console.log(`❌ Field ${index} processing error:`, error);
          }
          newErrors[field.id] = 'Invalid value for selected type';
        }
      });
      
      if (isDevelopment && showDebugPanel) {
        console.log('🏗️ buildObject result:', jsonObject);
      }
      return jsonObject;
    };

    const jsonObject = buildObject(fields);

    // Check for duplicate keys at each level
    const checkDuplicates = (fieldList: JSONField[]) => {
      const fieldsWithKeys = fieldList.filter(f => f.key.trim());
      if (validationUtils.hasDuplicateKeys(fieldsWithKeys)) {
        const duplicateKeys = new Set<string>();
        const seenKeys = new Set<string>();
        
        fieldsWithKeys.forEach(field => {
          if (seenKeys.has(field.key)) {
            duplicateKeys.add(field.key);
          } else {
            seenKeys.add(field.key);
          }
        });

        fieldsWithKeys.forEach(field => {
          if (duplicateKeys.has(field.key)) {
            newErrors[field.id] = 'Duplicate key';
          }
        });
      }
      
      // Check children recursively
      fieldList.forEach(field => {
        if (field.children && field.children.length > 0) {
          checkDuplicates(field.children);
        }
      });
    };

    checkDuplicates(fields);

    if (isDevelopment && showDebugPanel) {
      console.log('📝 Setting errors:', newErrors);
      console.log('📝 Setting JSON:', jsonObject);
    }
    
    setErrors(newErrors);
    setGeneratedJSON(jsonObject);
    
    return { errors: newErrors, json: jsonObject };
  }, [fields, isDevelopment, showDebugPanel]);

  // Auto-save fields to localStorage and generate JSON
  useEffect(() => {
    storage.set('json-generator-fields', fields);
    generateJSON();
  }, [fields, generateJSON]);

  // Flatten nested fields for display
  const flattenedFields = useMemo(() => {
    const flatten = (fieldList: JSONField[], depth = 0): JSONField[] => {
      const result: JSONField[] = [];
      
      fieldList.forEach(field => {
        result.push({ ...field, depth });
        
        if (field.children && field.children.length > 0 && !field.isCollapsed) {
          result.push(...flatten(field.children, depth + 1));
        }
      });
      
      return result;
    };
    
    return flatten(fields);
  }, [fields]);

  const moveField = useCallback((dragId: string, hoverId: string, hoverParentId?: string) => {
    const newFields = dragDropUtils.moveField(fields, dragId, hoverId, hoverParentId);
    setFields(newFields);
  }, [fields]);

  const addField = useCallback((parentId?: string, index?: number) => {
    const newField: JSONField = {
      id: jsonUtils.generateId(),
      key: '',
      value: '',
      type: 'string',
      depth: 0,
      children: [],
      isCollapsed: false,
      parentId: parentId
    };

    if (parentId) {
      // Add as child field
      setFields(prevFields => {
        const updateChildren = (fieldList: JSONField[]): JSONField[] => {
          return fieldList.map(field => {
            if (field.id === parentId) {
              const newChildren = [...(field.children || [])];
              if (index !== undefined) {
                newChildren.splice(index, 0, newField);
              } else {
                newChildren.push(newField);
              }
              return { ...field, children: newChildren };
            } else if (field.children) {
              return { ...field, children: updateChildren(field.children) };
            }
            return field;
          });
        };
        
        return updateChildren(prevFields);
      });
    } else {
      // Add as root field
      if (index !== undefined) {
        setFields(prevFields => {
          const newFields = [...prevFields];
          newFields.splice(index, 0, newField);
          return newFields;
        });
      } else {
        setFields(prevFields => [...prevFields, newField]);
      }
    }
  }, [fields]);

  const removeField = useCallback((id: string) => {
    const removeFromFields = (fieldList: JSONField[]): JSONField[] => {
      return fieldList.filter(field => field.id !== id).map(field => {
        const updatedField = {
          ...field,
          children: field.children ? removeFromFields(field.children) : []
        };
        
        // Re-index array children after removal
        if (field.type === 'array' && updatedField.children) {
          updatedField.children = updatedField.children.map((child, index) => ({
            ...child,
            key: index.toString()
          }));
        }
        
        return updatedField;
      });
    };

    const newFields = removeFromFields(fields);
    
    // Ensure at least one root field exists
    if (newFields.length === 0) {
      setFields([{
        id: jsonUtils.generateId(),
        key: '',
        value: '',
        type: 'string',
        depth: 0,
        children: [],
        isCollapsed: false
      }]);
    } else {
      setFields(newFields);
    }
  }, [fields]);

  const updateField = useCallback((id: string, updates: Partial<JSONField>) => {
    const updateInFields = (fieldList: JSONField[]): JSONField[] => {
      return fieldList.map(field => {
        if (field.id === id) {
          const updatedField = { ...field, ...updates };
          
          // If type changed to object/array, ensure children array exists
          if ((updates.type === 'object' || updates.type === 'array') && !updatedField.children) {
            updatedField.children = [];
          }
          
          return updatedField;
        } else if (field.children) {
          return { ...field, children: updateInFields(field.children) };
        }
        return field;
      });
    };

    setFields(updateInFields(fields));
  }, [fields]);

  const toggleCollapse = useCallback((id: string) => {
    const field = getFieldById(id);
    updateField(id, { isCollapsed: !(field?.isCollapsed) });
  }, [getFieldById, updateField]);

  const clearAll = () => {
    setFields([{
      id: jsonUtils.generateId(),
      key: '',
      value: '',
      type: 'string',
      depth: 0,
      children: [],
      isCollapsed: false
    }]);
    storage.remove('json-generator-fields');
  };

  const hasErrors = Object.keys(errors).length > 0;
  const hasValidFields = flattenedFields.some(field => field.key.trim() && !errors[field.id]);
  const totalFieldsCount = flattenedFields.length;
  const validFieldsCount = flattenedFields.filter(f => f.key.trim() && !errors[f.id]).length;

  if (isDevelopment && showDebugPanel) {
    console.log('🎯 Render state:', {
      fieldsCount: fields.length,
      flattenedFieldsCount: flattenedFields.length,
      hasErrors,
      hasValidFields,
      generatedJSONKeys: Object.keys(generatedJSON).length,
      generatedJSON
    });
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              JSON Generator
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create JSON objects with nested structures, drag to reorder, and export your data
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="text-center">
              <div className="font-semibold text-gray-900 dark:text-white">{totalFieldsCount}</div>
              <div>Total Fields</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600 dark:text-green-400">{validFieldsCount}</div>
              <div>Valid Fields</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-600 dark:text-blue-400">
                {Object.keys(generatedJSON).length}
              </div>
              <div>JSON Keys</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Input Form */}
        <div className="space-y-6" data-tour="field-input">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Fields
            </h2>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => addField()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-2"
                title={showTooltips ? "Add new field (Ctrl+Enter)" : undefined}
                data-tour="add-field-button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Field</span>
              </button>

              <div className="flex items-center space-x-1">
                <button
                  onClick={expandAll}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  title={showTooltips ? "Expand all nested fields (Ctrl+E)" : undefined}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
                
                <button
                  onClick={collapseAll}
                  className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                  title={showTooltips ? "Collapse all nested fields (Escape)" : undefined}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7-7m0 0l-7 7m7-7v18" />
                  </svg>
                </button>

              </div>

              <button
                onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                title="Settings"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              <button
                onClick={clearAll}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center space-x-2"
                title={showTooltips ? "Clear all fields (Ctrl+Shift+K)" : undefined}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettingsPanel && (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Settings & Options</h3>
                  <button
                    onClick={() => setShowSettingsPanel(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTooltips}
                      onChange={() => toggleTooltips()}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Show tooltips</span>
                    <span className="text-xs text-gray-500">(Ctrl+Shift+T)</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={animationsEnabled}
                      onChange={() => toggleAnimations()}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Enable animations</span>
                    <span className="text-xs text-gray-500">(Ctrl+Shift+A)</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCompactMode}
                      onChange={() => toggleCompactMode()}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Compact view</span>
                    <span className="text-xs text-gray-500">(Ctrl+D)</span>
                  </label>
                  
                  {isDevelopment && (
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showDebugPanel}
                        onChange={() => toggleDebugPanel()}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Debug panel</span>
                      <span className="text-xs text-gray-500">(Dev only)</span>
                    </label>
                  )}
                </div>

                {/* Settings descriptions */}
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 border-t pt-3">
                  <div><strong>Tooltips:</strong> Show helpful hints and keyboard shortcuts</div>
                  <div><strong>Animations:</strong> Enable smooth transitions and visual effects</div>
                  <div><strong>Compact view:</strong> Reduce spacing and show more fields at once</div>
                  {isDevelopment && <div><strong>Debug panel:</strong> Show development information and logs</div>}
                </div>
              </div>
            </div>
          )}

          {/* Fields List */}
          <div 
            className={`space-y-${isCompactMode ? '2' : '3'} ${animationsEnabled ? 'transition-all duration-200' : ''}`}
          >
            {flattenedFields.map((field, index) => {
              const parentField = findParentField(field.id, fields);
              
              // Calculate the actual index within parent's children array for array children
              let childIndex = index;
              if (parentField?.type === 'array' && parentField.children) {
                childIndex = parentField.children.findIndex(child => child.id === field.id);
              }
              
              return (
                <div
                  key={field.id}
                  className={animationsEnabled ? 'animate-in fade-in duration-200' : ''}
                >
                  <FieldInput
                    field={field}
                    index={childIndex}
                    error={errors[field.id]}
                    onUpdate={(updates) => updateField(field.id, updates)}
                    onRemove={() => removeField(field.id)}
                    onAddChild={() => addField(field.id)}
                    onToggleCollapse={() => toggleCollapse(field.id)}
                    onMove={moveField}
                    canRemove={flattenedFields.length > 1}
                    hasChildren={(field.children || []).length > 0}
                    allFields={fields}
                    isCompact={isCompactMode}
                    parentField={parentField || undefined}
                  />
                </div>
              );
            })}
          </div>

          {/* Keyboard Shortcuts Help */}
          {showTooltips && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                ⌨️ Keyboard Shortcuts:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="text-blue-800 dark:text-blue-200">
                  <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded font-mono">Ctrl+Enter</kbd> Add field
                </div>
                <div className="text-blue-800 dark:text-blue-200">
                  <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded font-mono">Ctrl+E</kbd> Expand all
                </div>
                <div className="text-blue-800 dark:text-blue-200">
                  <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded font-mono">Escape</kbd> Collapse all
                </div>
                <div className="text-blue-800 dark:text-blue-200">
                  <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded font-mono">Ctrl+Shift+K</kbd> Clear all
                </div>
                <div className="text-blue-800 dark:text-blue-200">
                  <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded font-mono">Ctrl+D</kbd> Toggle compact
                </div>
                <div className="text-blue-800 dark:text-blue-200">
                  <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded font-mono">Ctrl+Shift+T</kbd> Toggle tooltips
                </div>
              </div>
            </div>
          )}

          {/* Debug Panel for Development */}
          {isDevelopment && showDebugPanel && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">🐛 Debug Panel</div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <div>Total Fields: {fields.length}</div>
                <div>Flattened Fields: {flattenedFields.length}</div>
                <div>Fields with Keys: {flattenedFields.filter(f => f.key.trim()).length}</div>
                <div>Fields with Errors: {Object.keys(errors).length}</div>
                <div>Valid Fields: {flattenedFields.filter(f => f.key.trim() && !errors[f.id]).length}</div>
                <div>Generated JSON Keys: {Object.keys(generatedJSON).length}</div>
                <div>Current JSON: {JSON.stringify(generatedJSON)}</div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    console.log('🔄 Manual generateJSON call');
                    generateJSON();
                  }}
                  className="px-3 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                >
                  Force Generate JSON
                </button>
                <button
                  onClick={() => {
                    console.log('📋 Current state:', { fields, errors, generatedJSON });
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                >
                  Log State
                </button>
              </div>
            </div>
          )}

          {/* Quick Guide */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
              💡 Quick Guide:
            </h3>
            <ul className="text-xs text-green-800 dark:text-green-200 space-y-1">
              <li><strong>Add Field:</strong> Creates a new key-value pair at the root level</li>
              <li><strong>Expand All:</strong> Opens all collapsed nested objects and arrays</li>  
              <li><strong>Collapse All:</strong> Closes all nested structures for easier navigation</li>
              <li><strong>Object Type:</strong> Use for nested JSON objects - click + to add child properties</li>
              <li><strong>Array Type:</strong> Use for JSON arrays - add child fields as array items</li>
              <li><strong>Drag & Drop:</strong> Reorder fields by dragging them around</li>
              <li><strong>Compact View:</strong> Reduces spacing to show more fields at once</li>
              <li><strong>Animations:</strong> Smooth transitions when adding/removing fields</li>
            </ul>
          </div>
        </div>

        {/* JSON Preview */}
        <div data-tour="json-preview">
          <JSONPreview
            json={generatedJSON}
            hasValidFields={hasValidFields}
            hasErrors={hasErrors}
          />
        </div>
      </div>
    </div>
  );
};

export default JSONGenerator;