import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background Solid */}
      <rect width="100" height="100" fill="currentColor" className="text-black"/>
      
      {/* Architectural 'A' / Horizon Lines */}
      <path d="M20 80 L50 20 L80 80" stroke="white" strokeWidth="8" strokeLinecap="square"/>
      <path d="M35 55 L65 55" stroke="white" strokeWidth="6"/>
      
      {/* Horizon Line */}
      <line x1="0" y1="80" x2="100" y2="80" stroke="white" strokeWidth="4"/>
      
      {/* Grid Accents */}
      <rect x="10" y="10" width="10" height="10" fill="white" fillOpacity="0.5"/>
      <rect x="80" y="10" width="10" height="10" fill="white" fillOpacity="0.5"/>
    </svg>
  );
};