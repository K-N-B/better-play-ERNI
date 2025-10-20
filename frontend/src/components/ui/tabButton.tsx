import React from 'react';
import clsx from 'clsx'; // Utility for conditional classes

interface TabButtonProps {
  label: string; // The text displayed on the button
  isActive: boolean; // Whether this tab is currently selected
  onClick: () => void; // Function to call when the button is clicked
}

export const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-4 py-2 rounded-md font-medium text-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50', // Base styles & focus ring
        isActive
          ? 'bg-primary text-white shadow-sm' // Active state styles
          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800' // Inactive state styles
      )}
    >
      {label}
    </button>
  );
};

// Make sure to export it if you use 'export const'
// export default TabButton; // Alternatively, use default export