import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  overlay?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...', 
  overlay = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg', 
    xl: 'text-xl'
  };

  const spinner = (
    <div 
      className={`flex flex-col items-center justify-center space-y-3 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <svg
        className={`${sizeClasses[size]} animate-spin text-blue-600 dark:text-blue-400`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      
      {text && (
        <div className={`${textSizeClasses[size]} text-gray-600 dark:text-gray-400 font-medium animate-pulse`}>
          {text}
        </div>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  // For route-level loading, provide a full page centered spinner
  if (!className.includes('h-') && !className.includes('min-h-')) {
    return (
      <div className="flex items-center justify-center min-h-[400px] py-12">
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Skeleton loading components for specific use cases
export const LoadingSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
);

export const LoadingCard: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
    <LoadingSkeleton className="h-4 w-3/4" />
    <LoadingSkeleton className="h-4 w-1/2" />
    <LoadingSkeleton className="h-32 w-full" />
    <div className="flex space-x-2">
      <LoadingSkeleton className="h-8 w-20" />
      <LoadingSkeleton className="h-8 w-20" />
    </div>
  </div>
);

export const LoadingTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <LoadingSkeleton key={i} className="h-4 w-full" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, j) => (
          <LoadingSkeleton key={j} className="h-3 w-full" />
        ))}
      </div>
    ))}
  </div>
);

// Progress bar for file uploads or processing
export const ProgressBar: React.FC<{ 
  progress: number; 
  text?: string;
  className?: string;
}> = ({ progress, text, className = '' }) => (
  <div className={`w-full ${className}`}>
    {text && (
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
        <span>{text}</span>
        <span>{Math.round(progress)}%</span>
      </div>
    )}
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div 
        className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  </div>
);

export default LoadingSpinner;