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
        'px-4 py-2 rounded-md font-medium text-sm transition-colors duration-150 ease-in-out ', // Base styles & focus ring
        isActive
          ? 'bg-primary shadow-[0_5px_0_0] shadow-primary-800 text-white translate-y-[2px] transition-all duration-150' // Active state styles
          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800' // Inactive state styles
      )}
    >
      {label}
    </button>
  );
};

// Make sure to export it if you use 'export const'
// export default TabButton; // Alternatively, use default export