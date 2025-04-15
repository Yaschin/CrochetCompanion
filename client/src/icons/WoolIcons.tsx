import React from 'react';

export function WoolBallIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="9"></circle>
      <path d="M12 3a9 9 0 0 1 9 9"></path>
      <path d="M3 12a9 9 0 0 1 9-9"></path>
      <path d="M12 21a9 9 0 0 1-9-9"></path>
      <path d="M21 12a9 9 0 0 1-9 9"></path>
      <path d="M8 12a4 4 0 0 1 8 0"></path>
      <path d="M12 8a4 4 0 0 1 0 8"></path>
    </svg>
  );
}

export function YarnIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="9"></circle>
      <path d="M10 8a4.95 4.95 0 0 1 4 2"></path>
      <path d="M8.5 9.5a5.13 5.13 0 0 1 3 1"></path>
      <path d="M13.5 14.5a5 5 0 0 1-3-1"></path>
      <path d="M10.5 16a4.93 4.93 0 0 1-3.5-2"></path>
      <path d="M12 16a5 5 0 0 0 5-5"></path>
      <path d="M15.5 10.5a4.93 4.93 0 0 0-5-5"></path>
    </svg>
  );
}

export function SizeIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M3 6h18"></path>
      <path d="M7 12h10"></path>
      <path d="M11 18h2"></path>
      <path d="M17 6v12"></path>
      <path d="M7 6v12"></path>
    </svg>
  );
}

export function PatternIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M21 3H3v18h18V3z"></path>
      <path d="M9 3v18"></path>
      <path d="M3 9h18"></path>
      <path d="M3 15h18"></path>
      <path d="M15 3v18"></path>
    </svg>
  );
}