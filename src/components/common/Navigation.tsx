// src/components/common/Navigation.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tool } from '../../types';

const tools: Tool[] = [
  {
    id: 'json-generator',
    name: 'JSON Generator',
    description: 'Create JSON from key-value pairs',
    path: '/',
    icon: '🔧'
  },
  {
    id: 'json-validator',
    name: 'JSON Validator',
    description: 'Validate and format JSON',
    path: '/validator',
    icon: '✅'
  },
  {
    id: 'csv-converter',
    name: 'CSV to JSON',
    description: 'Convert CSV to JSON',
    path: '/converter',
    icon: '🔄'
  },
  {
    id: 'xml-converter',
    name: 'XML to JSON',
    description: 'Convert XML to JSON',
    path: '/xml-converter',
    icon: '📄'
  }
];

const Navigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav 
      className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
      role="navigation"
      aria-label="Main navigation"
      id="main-navigation"
      data-tour="navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto py-4" role="tablist">
          {tools.map((tool) => {
            const isActive = location.pathname === tool.path;
            return (
              <Link
                key={tool.id}
                to={tool.path}
                role="tab"
                aria-selected={isActive}
                aria-describedby={`${tool.id}-description`}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-2" aria-hidden="true">{tool.icon}</span>
                <div>
                  <div>{tool.name}</div>
                  <div 
                    id={`${tool.id}-description`}
                    className="text-xs text-gray-500 dark:text-gray-400"
                  >
                    {tool.description}
                  </div>
                </div>
                {isActive && (
                  <span className="sr-only">(current page)</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;