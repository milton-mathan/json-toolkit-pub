import React from 'react';
import { usePreferences } from '../../hooks/usePreferences';
import { useLayout } from '../../hooks/useLayout';
import { LayoutContext, LayoutContextType } from '../../context/LayoutContext';

interface LayoutProviderProps {
  children: React.ReactNode;
}

export const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
  const { preferences } = usePreferences();

  const getContainerClass = () => {
    const baseClass = 'mx-auto px-4 sm:px-6 lg:px-8';
    
    switch (preferences.layout) {
      case 'compact':
        return `${baseClass} max-w-4xl`;
      case 'wide':
        return `${baseClass} max-w-none`;
      default:
        return `${baseClass} max-w-7xl`;
    }
  };

  const getPanelClass = () => {
    const baseClass = 'gap-6';
    
    if (preferences.panelLayout === 'vertical') {
      return `flex flex-col ${baseClass}`;
    }
    
    // Horizontal layout - responsive
    return `grid grid-cols-1 lg:grid-cols-2 ${baseClass}`;
  };

  const getCardClass = () => {
    const baseSpacing = preferences.compactMode ? 'p-4' : 'p-6';
    const baseClass = `bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${baseSpacing}`;
    
    return baseClass;
  };

  const getSpacingClass = () => {
    if (preferences.compactMode) {
      return 'space-y-3';
    }
    return 'space-y-6';
  };

  const value: LayoutContextType = {
    layout: preferences.layout,
    panelLayout: preferences.panelLayout,
    compactMode: preferences.compactMode,
    getContainerClass,
    getPanelClass,
    getCardClass,
    getSpacingClass
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};

// Layout wrapper components
export const ResponsiveContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  const { getContainerClass } = useLayout();
  return (
    <div className={`${getContainerClass()} ${className}`}>
      {children}
    </div>
  );
};

export const PanelGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  const { getPanelClass } = useLayout();
  return (
    <div className={`${getPanelClass()} ${className}`}>
      {children}
    </div>
  );
};

export const Card: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ children, className = '', title, subtitle, actions }) => {
  const { getCardClass, compactMode } = useLayout();
  
  return (
    <div className={`${getCardClass()} ${className}`}>
      {(title || subtitle || actions) && (
        <div className={`flex items-center justify-between ${compactMode ? 'mb-3' : 'mb-4'}`}>
          <div>
            {title && (
              <h3 className={`font-semibold text-gray-900 dark:text-white ${compactMode ? 'text-base' : 'text-lg'}`}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export const Section: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  title?: string;
  description?: string;
}> = ({ children, className = '', title, description }) => {
  const { getSpacingClass, compactMode } = useLayout();
  
  return (
    <section className={`${getSpacingClass()} ${className}`}>
      {(title || description) && (
        <div className={compactMode ? 'mb-3' : 'mb-4'}>
          {title && (
            <h2 className={`font-bold text-gray-900 dark:text-white ${compactMode ? 'text-lg' : 'text-xl'}`}>
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
};

// Responsive utility component
export const ResponsiveGrid: React.FC<{
  children: React.ReactNode;
  cols?: { sm?: number; md?: number; lg?: number; xl?: number };
  gap?: number;
  className?: string;
}> = ({ children, cols = { lg: 2 }, gap = 6, className = '' }) => {
  const { compactMode } = useLayout();
  
  const gridCols: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2', 
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    12: 'grid-cols-12'
  };
  
  const gapClass = compactMode ? `gap-${Math.max(1, gap - 2)}` : `gap-${gap}`;
  
  let gridClass = 'grid grid-cols-1';
  
  if (cols.sm) gridClass += ` sm:${gridCols[cols.sm]}`;
  if (cols.md) gridClass += ` md:${gridCols[cols.md]}`;
  if (cols.lg) gridClass += ` lg:${gridCols[cols.lg]}`;
  if (cols.xl) gridClass += ` xl:${gridCols[cols.xl]}`;
  
  return (
    <div className={`${gridClass} ${gapClass} ${className}`}>
      {children}
    </div>
  );
};

// Button with layout-aware styling
export const LayoutButton: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}> = ({ 
  children, 
  variant = 'secondary', 
  size, 
  className = '', 
  onClick, 
  disabled = false,
  type = 'button'
}) => {
  const { compactMode } = useLayout();
  
  const actualSize = size || (compactMode ? 'sm' : 'md');
  
  const baseClass = 'font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    outline: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-blue-500'
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${sizeClasses[actualSize]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};