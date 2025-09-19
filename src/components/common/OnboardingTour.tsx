import React, { useState, useEffect } from 'react';
import { usePreferences } from '../../hooks/usePreferences';
import { useLocation } from 'react-router-dom';

interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  offset?: { x: number; y: number };
}

interface Tour {
  id: string;
  name: string;
  description: string;
  steps: TourStep[];
  autoStart?: boolean;
  route?: string; // Route where this tour should be active
}

const tours: Tour[] = [
  {
    id: 'welcome',
    name: 'Welcome Tour',
    description: 'Get started with JSON Toolkit',
    autoStart: true,
    steps: [
      {
        id: 'welcome-1',
        target: '[data-tour="header"]',
        title: 'Welcome to JSON Toolkit! 👋',
        content: 'A powerful set of tools for working with JSON and CSV data. Let\'s take a quick tour to get you started.',
        placement: 'bottom'
      },
      {
        id: 'welcome-2',
        target: '[data-tour="navigation"]',
        title: 'Navigation',
        content: 'Use these tabs to switch between different tools. Each tool is designed for specific data processing tasks.',
        placement: 'bottom'
      },
      {
        id: 'welcome-3',
        target: '[data-testid="theme-toggle"]',
        title: 'Theme & Accessibility',
        content: 'Toggle between light and dark themes. We also support high contrast mode and other accessibility features.',
        placement: 'left'
      },
      {
        id: 'welcome-4',
        target: '[data-tour="main-content"]',
        title: 'Main Workspace',
        content: 'This is where you\'ll do most of your work. Each tool has its own interface optimized for specific tasks.',
        placement: 'top'
      }
    ]
  },
  {
    id: 'json-generator',
    name: 'JSON Generator Tour',
    description: 'Learn how to create JSON from key-value pairs',
    route: '/',
    steps: [
      {
        id: 'generator-1',
        target: '[data-tour="add-field-button"]',
        title: 'Adding Fields',
        content: 'Click this button or use Ctrl+Enter to add new key-value pairs to your JSON.',
        placement: 'right'
      },
      {
        id: 'generator-2',
        target: '[data-tour="field-input"]',
        title: 'Field Configuration',
        content: 'Enter your key name, select the data type, and provide the value. You can create nested objects and arrays too!',
        placement: 'right'
      },
      {
        id: 'generator-3',
        target: '[data-tour="json-preview"]',
        title: 'Live Preview',
        content: 'Watch your JSON update in real-time as you make changes. The preview includes syntax highlighting and validation.',
        placement: 'left'
      },
      {
        id: 'generator-4',
        target: '[data-tour="export-buttons"]',
        title: 'Export Options',
        content: 'Copy to clipboard, download as file, or send to other tools for further processing.',
        placement: 'top'
      }
    ]
  },
  {
    id: 'json-validator',
    name: 'JSON Validator Tour',
    description: 'Learn how to validate and format JSON',
    route: '/validator',
    steps: [
      {
        id: 'validator-1',
        target: '[data-tour="json-input"]',
        title: 'JSON Input',
        content: 'Paste your JSON here or drag and drop a JSON file. The validator will check for syntax errors automatically.',
        placement: 'right'
      },
      {
        id: 'validator-2',
        target: '[data-tour="validation-results"]',
        title: 'Validation Results',
        content: 'See validation results here, including error messages with line numbers and suggestions for fixes.',
        placement: 'left'
      },
      {
        id: 'validator-3',
        target: '[data-tour="format-button"]',
        title: 'Formatting Tools',
        content: 'Format, minify, or beautify your JSON with these tools.',
        placement: 'top'
      }
    ]
  },
  {
    id: 'csv-converter',
    name: 'CSV Converter Tour',
    description: 'Learn how to convert CSV to JSON',
    route: '/converter',
    steps: [
      {
        id: 'converter-1',
        target: '[data-tour="file-upload"]',
        title: 'File Upload',
        content: 'Upload your CSV file by clicking here or dragging it onto the upload area.',
        placement: 'bottom'
      },
      {
        id: 'converter-2',
        target: '[data-tour="csv-options"]',
        title: 'Conversion Options',
        content: 'Configure how your CSV should be converted - delimiter, headers, data types, and output format.',
        placement: 'right'
      },
      {
        id: 'converter-3',
        target: '[data-tour="preview-section"]',
        title: 'Preview & Results',
        content: 'Review your CSV data and see the converted JSON output before exporting.',
        placement: 'left'
      }
    ]
  }
];

interface OnboardingTourProps {
  onComplete?: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const { preferences, completeTour } = usePreferences();
  const location = useLocation();
  const [currentTour, setCurrentTour] = useState<Tour | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false
  });

  // Find available tours for current route
  const getAvailableTours = () => {
    return tours.filter(tour => {
      const isCompleted = preferences.tourCompleted.includes(tour.id);
      const isRouteMatch = !tour.route || tour.route === location.pathname;
      return !isCompleted && isRouteMatch;
    });
  };

  // Start tour
  const startTour = (tourId: string) => {
    const tour = tours.find(t => t.id === tourId);
    if (!tour) return;

    setCurrentTour(tour);
    setCurrentStep(0);
    setIsActive(true);
    updateTooltipPosition(tour.steps[0]);
  };

  // Update tooltip position based on target element
  const updateTooltipPosition = (step: TourStep) => {
    const element = document.querySelector(step.target);
    if (!element) {
      setTooltip(prev => ({ ...prev, visible: false }));
      return;
    }

    const rect = element.getBoundingClientRect();
    const offset = step.offset || { x: 0, y: 0 };
    let x = rect.left + rect.width / 2 + offset.x;
    let y = rect.top + rect.height / 2 + offset.y;

    // Adjust position based on placement
    switch (step.placement) {
      case 'top':
        y = rect.top - 10 + offset.y;
        break;
      case 'bottom':
        y = rect.bottom + 10 + offset.y;
        break;
      case 'left':
        x = rect.left - 10 + offset.x;
        break;
      case 'right':
        x = rect.right + 10 + offset.x;
        break;
    }

    setTooltip({ x, y, visible: true });

    // Highlight target element
    element.classList.add('tour-highlight');
    
    // Remove highlight from previous elements
    document.querySelectorAll('.tour-highlight').forEach(el => {
      if (el !== element) {
        el.classList.remove('tour-highlight');
      }
    });

    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Next step
  const nextStep = () => {
    if (!currentTour) return;

    if (currentStep < currentTour.steps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      updateTooltipPosition(currentTour.steps[newStep]);
    } else {
      finishTour();
    }
  };

  // Previous step
  const prevStep = () => {
    if (!currentTour || currentStep === 0) return;

    const newStep = currentStep - 1;
    setCurrentStep(newStep);
    updateTooltipPosition(currentTour.steps[newStep]);
  };

  // Finish tour
  const finishTour = () => {
    if (!currentTour) return;

    completeTour(currentTour.id);
    setIsActive(false);
    setCurrentTour(null);
    setCurrentStep(0);
    setTooltip(prev => ({ ...prev, visible: false }));

    // Remove all highlights
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });

    if (onComplete) {
      onComplete();
    }
  };

  // Skip tour
  const skipTour = () => {
    finishTour();
  };

  // Auto-start tour for new users
  useEffect(() => {
    if (!preferences.showOnboarding) return;

    const availableTours = getAvailableTours();
    const welcomeTour = availableTours.find(t => t.id === 'welcome' && t.autoStart);
    
    if (welcomeTour && preferences.tourCompleted.length === 0) {
      // Start welcome tour after a short delay
      const timer = setTimeout(() => {
        startTour('welcome');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname, preferences.showOnboarding]);

  // Update tooltip position on step change
  useEffect(() => {
    if (currentTour && isActive) {
      updateTooltipPosition(currentTour.steps[currentStep]);
    }
  }, [currentStep, currentTour, isActive]);

  if (!isActive || !currentTour || !tooltip.visible) {
    return null;
  }

  const step = currentTour.steps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/30 z-40"
        onClick={skipTour}
      />

      {/* Tooltip */}
      <div
        className="fixed z-50 max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4"
        style={{
          left: tooltip.x,
          top: tooltip.y,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            {step.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {step.content}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {currentStep + 1} of {currentTour.steps.length}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={skipTour}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Skip
            </button>
            
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
              >
                Back
              </button>
            )}
            
            <button
              onClick={nextStep}
              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              {currentStep === currentTour.steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
          <div
            className="bg-blue-600 h-1 rounded-full transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / currentTour.steps.length) * 100}%`
            }}
          />
        </div>
      </div>
    </>
  );
};

// Tour trigger component
export const TourButton: React.FC<{ tourId: string; children: React.ReactNode }> = ({ 
  tourId, 
  children 
}) => {
  const { preferences } = usePreferences();
  
  const tour = tours.find(t => t.id === tourId);
  const isCompleted = preferences.tourCompleted.includes(tourId);
  
  if (!tour || isCompleted) {
    return null;
  }

  const startTour = () => {
    // This would trigger the tour
    const event = new CustomEvent('start-tour', { detail: { tourId } });
    window.dispatchEvent(event);
  };

  return (
    <button
      onClick={startTour}
      className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{children}</span>
    </button>
  );
};

export default OnboardingTour;