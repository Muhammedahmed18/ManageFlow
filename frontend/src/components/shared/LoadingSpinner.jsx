import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Universal Loading Spinner Component
 * 
 * Usage Examples:
 * 
 * // Basic loading spinner
 * <LoadingSpinner />
 * 
 * // Large spinner with text
 * <LoadingSpinner size="lg" text="Loading data..." />
 * 
 * // Small white spinner for buttons
 * <LoadingSpinner size="sm" color="white" showText={false} />
 * 
 * // Full screen overlay
 * <LoadingSpinner size="xl" text="Processing..." fullScreen={true} />
 * 
 * // Custom styling
 * <LoadingSpinner size="md" color="success" className="my-4" />
 * 
 * Props:
 * - size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' (default: 'md')
 * - color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'white' | 'gray' (default: 'primary')
 * - text: string (default: '')
 * - fullScreen: boolean (default: false)
 * - className: string (default: '')
 * - showSpinner: boolean (default: true)
 * - showText: boolean (default: true)
 */
const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  text = '', 
  fullScreen = false,
  className = '',
  showSpinner = true,
  showText = true
}) => {
  // Size variants
  const sizeVariants = {
    xs: { spinner: 12, text: 'text-xs' },
    sm: { spinner: 16, text: 'text-sm' },
    md: { spinner: 24, text: 'text-base' },
    lg: { spinner: 32, text: 'text-lg' },
    xl: { spinner: 40, text: 'text-xl' },
    '2xl': { spinner: 48, text: 'text-2xl' }
  };

  // Color variants
  const colorVariants = {
    primary: '#1C2E4A',
    secondary: '#52677D',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    white: '#FFFFFF',
    gray: '#6B7280'
  };

  const currentSize = sizeVariants[size] || sizeVariants.md;
  const currentColor = colorVariants[color] || colorVariants.primary;

  const spinnerElement = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {showSpinner && (
        <Loader2 
          size={currentSize.spinner} 
          className="animate-spin mb-2" 
          style={{ color: currentColor }}
        />
      )}
      {showText && text && (
        <p className={`${currentSize.text} font-medium`} style={{ color: currentColor }}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
};

export default LoadingSpinner;

