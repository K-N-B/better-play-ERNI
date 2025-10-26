// /src/components/ui/LoadingSpinner.tsx
import React from 'react';
import clsx from 'clsx'; // Import clsx for cleaner conditional classes

// Define possible sizes (you can customize these)
type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Define props for the component
interface LoadingSpinnerProps {
  size?: SpinnerSize; // Make size optional, default to 'md'
  fullPage?: boolean;
}

// Map size prop to Tailwind classes
const sizeMap: Record<SpinnerSize, string> = {
  xs: 'h-4 w-4 border-2', // Extra small
  sm: 'h-6 w-6 border-2', // Small
  md: 'h-8 w-8 border-[3px]', // Medium (default)
  lg: 'h-12 w-12 border-4', // Large
  xl: 'h-16 w-16 border-4', // Extra large
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', fullPage = false }) => {
  const sizeClasses = sizeMap[size] || sizeMap.md; // Get classes or fallback to medium

  return (
    // Outer div for centering if fullPage is true
    <div className={clsx(fullPage && 'flex items-center justify-center h-full w-full')}>
      {/* The spinner element */}
      <div
        className={clsx(
          "animate-spin rounded-full border-blue-500 border-b-transparent", // Base styles: color, transparent bottom border for spin effect
          sizeClasses // Apply dynamic size and border width
        )}
        role="status" // Accessibility
        aria-live="polite"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span> {/* Accessibility */}
      </div>
    </div>
  );
};