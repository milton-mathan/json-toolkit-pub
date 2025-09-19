// src/components/json-generator/FieldInput.tsx
import React, { useState, useRef, memo } from 'react';
import { JSONField } from '../../types';
import { dragDropUtils, DragItem } from '../../utils/dragDrop';
import { performanceUtils } from '../../utils/performance';

interface FieldInputProps {
  field: JSONField;
  error?: string;
  index: number;
  onUpdate: (updates: Partial<JSONField>) => void;
  onRemove: () => void;
  onAddChild: () => void;
  onToggleCollapse: () => void;
  onMove: (dragId: string, hoverId: string, hoverParentId?: string) => void;
  canRemove: boolean;
  hasChildren: boolean;
  allFields: JSONField[];
  isCompact?: boolean;
  parentField?: JSONField; // Add parent field info
}

const FieldInput: React.FC<FieldInputProps> = ({
  field,
  error,
  index,
  onUpdate,
  onRemove,
  onAddChild,
  onToggleCollapse,
  onMove,
  canRemove,
  hasChildren,
  allFields,
  isCompact = false,
  parentField
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState<'before' | 'after' | 'inside' | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  
  const depth = field.depth || 0;
  const isNestableType = field.type === 'object' || field.type === 'array';
  
  // Check if this field is a child of an array parent
  const isArrayChild = parentField?.type === 'array';
  
  // Get the array index for display if this is an array child
  const arrayIndex = isArrayChild ? index : null;

  // Drag handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const dragData: DragItem = {
      id: field.id,
      index,
      type: 'field',
      parentId: field.parentId
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOver(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const rect = dragRef.current?.getBoundingClientRect();
    if (!rect) return;

    const y = e.clientY - rect.top;
    const height = rect.height;
    
    // Determine drop zone based on cursor position
    if (y < height * 0.25) {
      setDragOver('before');
    } else if (y > height * 0.75) {
      setDragOver('after');
    } else if (isNestableType) {
      setDragOver('inside');
    } else {
      setDragOver('before');
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only clear if actually leaving the element (not entering a child)
    const rect = dragRef.current?.getBoundingClientRect();
    if (rect && (
      e.clientX < rect.left || 
      e.clientX > rect.right || 
      e.clientY < rect.top || 
      e.clientY > rect.bottom
    )) {
      setDragOver(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(null);

    try {
      const dragData: DragItem = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (dragData.id === field.id) return; // Can't drop on self
      
      if (!dragDropUtils.canDrop(dragData.id, field.id, allFields)) return;

      let targetParentId: string | undefined;
      
      if (dragOver === 'inside' && isNestableType) {
        targetParentId = field.id;
      } else {
        targetParentId = field.parentId;
      }

      onMove(dragData.id, field.id, targetParentId);
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };
  
  const handleTypeChange = (newType: JSONField['type']) => {
    let newValue = '';
    
    // Set appropriate default values for different types
    switch (newType) {
      case 'boolean':
        newValue = 'false';
        break;
      case 'number':
        newValue = '0';
        break;
      case 'null':
        newValue = '';
        break;
      case 'object':
        newValue = '{}';
        break;
      case 'array':
        newValue = '[]';
        break;
      default:
        newValue = '';
    }
    
    onUpdate({ type: newType, value: newValue });
  };

  const getTypeIcon = (type: JSONField['type']) => {
    const iconClass = isCompact ? "w-3 h-3" : "w-4 h-4";
    
    switch (type) {
      case 'string':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        );
      case 'number':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        );
      case 'boolean':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'null':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
        );
      case 'object':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'array':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderValueInput = () => {
    const inputPadding = isCompact ? 'px-2 py-1' : 'px-3 py-2';
    const textSize = isCompact ? 'text-xs' : 'text-sm';
    const baseInputClasses = `w-full ${inputPadding} border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${textSize} transition-all duration-200`;
    const errorClasses = error 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500';

    // For nested objects/arrays with children, show a visual indicator instead of input
    if (isNestableType && hasChildren) {
      return (
        <div className={`w-full ${inputPadding} border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-400 ${textSize}`}>
          <div className="flex items-center justify-between">
            <span>
              {field.type === 'object' 
                ? `{${hasChildren ? '...' : ''}}`
                : `[${hasChildren ? '...' : ''}]`
              }
            </span>
            <span className={`${isCompact ? 'text-xs' : 'text-xs'} bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-1 rounded`}>
              {(field.children || []).length} items
            </span>
          </div>
        </div>
      );
    }

    switch (field.type) {
      case 'boolean':
        return (
          <select
            value={field.value?.toString() || 'false'}
            onChange={(e) => onUpdate({ value: e.target.value })}
            className={`${baseInputClasses} ${errorClasses}`}
          >
            <option value="false">false</option>
            <option value="true">true</option>
          </select>
        );

      case 'null':
        return (
          <input
            type="text"
            value="null"
            disabled
            className={`w-full ${inputPadding} border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 ${textSize}`}
          />
        );

      case 'object':
      case 'array':
        return (
          <textarea
            value={String(field.value || '')}
            onChange={(e) => onUpdate({ value: e.target.value })}
            placeholder={field.type === 'object' ? '{"key": "value"}' : '["item1", "item2"]'}
            rows={isCompact ? 1 : 2}
            className={`${baseInputClasses} ${errorClasses} resize-y`}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={String(field.value || '')}
            onChange={(e) => onUpdate({ value: e.target.value })}
            placeholder="123"
            className={`${baseInputClasses} ${errorClasses}`}
          />
        );

      default: // string
        return (
          <input
            type="text"
            value={String(field.value || '')}
            onChange={(e) => onUpdate({ value: e.target.value })}
            placeholder="Enter value"
            className={`${baseInputClasses} ${errorClasses}`}
          />
        );
    }
  };

  const padding = isCompact ? 'p-3' : 'p-4';
  const buttonSize = isCompact ? 'p-1' : 'p-2';
  const iconSize = isCompact ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div 
      ref={dragRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg 
        transition-all duration-300 ease-in-out cursor-move
        ${isDragging ? 'opacity-50 scale-95 rotate-2' : ''}
        ${isHovered ? 'shadow-lg scale-[1.02] border-blue-300 dark:border-blue-600' : 'hover:shadow-md'}
        ${dragOver === 'before' ? 'border-t-4 border-t-blue-500' : ''}
        ${dragOver === 'after' ? 'border-b-4 border-b-blue-500' : ''}
        ${dragOver === 'inside' && isNestableType ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
        ${error ? 'border-red-300 dark:border-red-600 bg-red-50/50 dark:bg-red-900/10' : ''}
      `}
      style={{ 
        marginLeft: `${depth * (isCompact ? 16 : 24)}px`,
        borderLeft: depth > 0 ? '3px solid rgb(59 130 246)' : undefined
      }}
    >
      {/* Depth indicator line */}
      {depth > 0 && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-400 dark:bg-blue-500 opacity-50"
          style={{ left: `${depth * (isCompact ? 8 : 12)}px` }}
        />
      )}

      <div className={padding}>
        {/* Mobile-first responsive layout */}
        <div className={`${isCompact ? 'space-y-2' : 'space-y-4'} md:space-y-0 md:grid md:grid-cols-12 md:gap-3 md:items-start`}>
          {/* Drag Handle and Collapse/Expand Button */}
          <div className="flex justify-between items-center md:col-span-1 md:flex-col md:pt-6 md:space-x-0 md:space-y-1">
            <div className="flex items-center space-x-1">
              {/* Drag Handle */}
              <div 
                className={`${buttonSize} transition-colors duration-200 cursor-move ${
                  isHovered 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                title="Drag to reorder"
              >
                <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </div>
              
              {/* Type Icon */}
              <div className={`${buttonSize} transition-colors duration-200 ${
                field.type === 'object' ? 'text-purple-500' :
                field.type === 'array' ? 'text-green-500' :
                field.type === 'number' ? 'text-blue-500' :
                field.type === 'boolean' ? 'text-yellow-500' :
                field.type === 'null' ? 'text-gray-500' :
                'text-pink-500'
              }`}>
                {getTypeIcon(field.type)}
              </div>
              
              {/* Collapse/Expand Button for Nestable Types */}
              {isNestableType && (
                <button
                  onClick={onToggleCollapse}
                  className={`${buttonSize} transition-all duration-200 ${
                    field.isCollapsed 
                      ? 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300' 
                      : 'text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200'
                  }`}
                  title={field.isCollapsed ? 'Expand children' : 'Collapse children'}
                >
                  <svg 
                    className={`${iconSize} transition-transform duration-200 ${
                      field.isCollapsed ? 'rotate-0' : 'rotate-90'
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            {/* Mobile Action Buttons */}
            <div className="flex items-center space-x-1 md:hidden">
              {/* Add Child Button (for object/array types) */}
              {isNestableType && (
                <button
                  onClick={onAddChild}
                  className={`${buttonSize} text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 transition-colors duration-200 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md`}
                  title="Add child field"
                >
                  <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              )}

              {/* Remove Button */}
              <button
                onClick={onRemove}
                disabled={!canRemove}
                className={`${buttonSize} text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md disabled:hover:bg-transparent`}
                title="Remove field"
              >
                <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Key Input */}
          <div className="md:col-span-3">
            <label className={`block ${isCompact ? 'text-xs' : 'text-sm'} font-medium text-gray-700 dark:text-gray-300 mb-1`}>
              {isArrayChild ? 'Index' : 'Key'}
              {depth > 0 && (
                <span className={`ml-1 ${isCompact ? 'text-xs' : 'text-xs'} text-blue-600 dark:text-blue-400`}>
                  (depth {depth})
                </span>
              )}
              {isArrayChild && (
                <span className={`ml-1 ${isCompact ? 'text-xs' : 'text-xs'} text-green-600 dark:text-green-400`}>
                  (auto)
                </span>
              )}
            </label>
            {isArrayChild ? (
              <input
                type="text"
                value={arrayIndex?.toString() || '0'}
                readOnly
                className={`w-full ${isCompact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} border rounded-md bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 cursor-not-allowed transition-all duration-200 border-gray-300 dark:border-gray-600`}
                title="Array indices are automatically managed"
              />
            ) : (
              <input
                type="text"
                value={field.key}
                onChange={(e) => onUpdate({ key: e.target.value })}
                placeholder="property_name"
                className={`w-full ${isCompact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 ${
                  error 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
            )}
          </div>

          {/* Type Selector */}
          <div className="md:col-span-2">
            <label className={`block ${isCompact ? 'text-xs' : 'text-sm'} font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center`}>
              Type
              {(field.type === 'object' || field.type === 'array') && (
                <div className="relative ml-1 group">
                  <svg 
                    className="w-3 h-3 text-gray-400 hover:text-blue-500 cursor-help transition-colors"
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-800 dark:bg-gray-600 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                    <div className="text-center">
                      <div className="font-semibold mb-1">Manual Format:</div>
                      <div className="font-mono">
                        {field.type === 'array' 
                          ? '["value1", "value2", 123]'
                          : '{"key": "value", "number": 123}'
                        }
                      </div>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800 dark:border-t-gray-600"></div>
                  </div>
                </div>
              )}
            </label>
            <select
              value={field.type}
              onChange={(e) => handleTypeChange(e.target.value as JSONField['type'])}
              className={`w-full ${isCompact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200`}
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="null">Null</option>
              <option value="object">Object</option>
              <option value="array">Array</option>
            </select>
          </div>

          {/* Value Input */}
          <div className="md:col-span-4">
            <label className={`block ${isCompact ? 'text-xs' : 'text-sm'} font-medium text-gray-700 dark:text-gray-300 mb-1`}>
              Value
              {isNestableType && hasChildren && (
                <span className={`ml-1 ${isCompact ? 'text-xs' : 'text-xs'} text-gray-500 dark:text-gray-400`}>
                  ({(field.children || []).length} nested)
                </span>
              )}
            </label>
            {renderValueInput()}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex md:col-span-2 md:pt-6 md:space-x-1">
            {/* Add Child Button (for object/array types) */}
            {isNestableType && (
              <button
                onClick={onAddChild}
                className={`${buttonSize} text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 transition-all duration-200 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md hover:scale-110`}
                title="Add child field"
              >
                <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            )}

            {/* Remove Button */}
            <button
              onClick={onRemove}
              disabled={!canRemove}
              className={`${buttonSize} text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md hover:scale-110 disabled:hover:scale-100 disabled:hover:bg-transparent`}
              title="Remove field"
            >
              <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`${isCompact ? 'mt-2 text-xs' : 'mt-3 text-sm'} text-red-600 dark:text-red-400 flex items-center animate-in fade-in duration-200`}>
            <svg className={`${iconSize} mr-1 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Visual indicators for nested types */}
        {isNestableType && !isCompact && (
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {field.type === 'object' ? 'Object' : 'Array'} - 
              {hasChildren 
                ? ` Using nested fields (${(field.children || []).length} children)`
                : ' Add child fields or use manual JSON input'
              }
            </span>
          </div>
        )}

        {/* Success indicator for valid fields */}
        {!error && field.key.trim() && !isCompact && (
          <div className="mt-2 flex items-center text-xs text-green-600 dark:text-green-400">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Valid field</span>
          </div>
        )}
      </div>

      {/* Enhanced Drop Zone Indicators */}
      {dragOver === 'before' && (
        <div className="absolute -top-1 left-4 right-4 h-0.5 bg-blue-500 rounded-full animate-pulse">
          <div className="absolute -left-1 -top-1 w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="absolute -right-1 -top-1 w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="absolute left-1/2 -top-3 transform -translate-x-1/2">
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">Drop above</span>
          </div>
        </div>
      )}
      
      {dragOver === 'after' && (
        <div className="absolute -bottom-1 left-4 right-4 h-0.5 bg-blue-500 rounded-full animate-pulse">
          <div className="absolute -left-1 -top-1 w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="absolute -right-1 -top-1 w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="absolute left-1/2 -bottom-8 transform -translate-x-1/2">
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">Drop below</span>
          </div>
        </div>
      )}
      
      {dragOver === 'inside' && isNestableType && (
        <div className="absolute inset-2 border-2 border-dashed border-blue-500 rounded-lg bg-blue-500/10 flex items-center justify-center animate-pulse">
          <div className="text-center">
            <div className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-1">
              Drop here to make it a child
            </div>
            <div className="text-blue-500 dark:text-blue-300 text-xs">
              Will be nested inside this {field.type}
            </div>
          </div>
        </div>
      )}

      {/* Hover overlay for better visual feedback */}
      {isHovered && !isDragging && (
        <div className="absolute inset-0 bg-blue-500/5 rounded-lg pointer-events-none" />
      )}
    </div>
  );
};

export default memo(FieldInput, (prevProps, nextProps) => {
  // Custom comparison for memo optimization
  return (
    performanceUtils.deepEqual(prevProps.field, nextProps.field) &&
    performanceUtils.deepEqual(prevProps.parentField, nextProps.parentField) &&
    prevProps.error === nextProps.error &&
    prevProps.index === nextProps.index &&
    prevProps.canRemove === nextProps.canRemove &&
    prevProps.hasChildren === nextProps.hasChildren &&
    prevProps.isCompact === nextProps.isCompact &&
    prevProps.onUpdate === nextProps.onUpdate &&
    prevProps.onRemove === nextProps.onRemove &&
    prevProps.onAddChild === nextProps.onAddChild &&
    prevProps.onToggleCollapse === nextProps.onToggleCollapse &&
    prevProps.onMove === nextProps.onMove
  );
});