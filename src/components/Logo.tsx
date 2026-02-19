
import React from 'react';
import { Link } from 'react-router-dom';

const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
);


const Logo: React.FC = () => {
  return (
    <Link to="/" className="flex items-center space-x-2">
      <MapPinIcon />
      <span className="text-2xl font-bold tracking-tight">
        <span className="text-teal-500">Traivo</span>
        <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">AI</span>
      </span>
    </Link>
  );
};

export default Logo;
