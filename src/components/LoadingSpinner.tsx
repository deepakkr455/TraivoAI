
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="w-8 h-8 border-4 border-teal-400 border-dashed rounded-full animate-spin"></div>
    </div>
  );
};

export default LoadingSpinner;
