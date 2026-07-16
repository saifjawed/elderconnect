import React from 'react';

const Logo = ({ className }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      className={className}
      width="100%" 
      height="100%"
    >
      {/* Chimney */}
      <rect x="70" y="14" width="7" height="25" rx="1" fill="#0d8f78" />

      {/* Roof Canopy */}
      <path d="M 50 10 L 8 43 A 3 3 0 0 0 12 48 L 50 18 L 88 48 A 3 3 0 0 0 92 43 Z" fill="#0d8f78" />

      {/* Elder Figure (Gold) */}
      <circle cx="58" cy="48" r="6" fill="#f39c12" />
      <path d="M 45 85 C 45 68 50 60 58 60 C 66 60 73 66 73 85 Z" fill="#f39c12" />

      {/* Caretaker Figure (Teal) */}
      <circle cx="38" cy="40" r="7" fill="#0d8f78" stroke="#ffffff" strokeWidth="1.5" />
      <path d="M 22 85 C 22 60 30 50 42 50 C 49 50 54 55 57 63 C 59 69 59 76 59 85 Z" fill="#0d8f78" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round" />

      {/* The Nest / Supportive Leaf (Light Teal) */}
      <path d="M 10 70 C 10 95 35 100 50 100 C 65 100 90 95 90 70 C 90 66 86 64 83 67 C 76 74 63 78 50 78 C 37 78 24 74 17 67 C 14 64 10 66 10 70 Z" fill="#20c997" />
    </svg>
  );
};

export default Logo;
