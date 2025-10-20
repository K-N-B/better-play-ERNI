// A reusable loading spinner for when data is being fetched.import React from 'react';

export const LoadingSpinner = ({ fullPage = false }) => {
  return (
    <div className={fullPage ? 'flex items-center justify-center h-screen' : ''}>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
};