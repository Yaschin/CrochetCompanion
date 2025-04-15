import React from 'react';

// Wool Ball Icon
export const WoolBallIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg className={props.className} fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" opacity="0.2" />
    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
    <path d="M12 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="white" />
    <path d="M18 12c0 3.314-2.686 6-6 6s-6-2.686-6-6c0-3.314 2.686-6 6-6s6 2.686 6 6z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    <path d="M14 14l1.5 1.5M10 14l-1.5 1.5M14 10l1.5-1.5M10 10l-1.5-1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
  </svg>
);

// Crochet Hook Icon
export const CrochetHookIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg className={props.className} fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M19 9l-7 7-7-7M5 15l7 7 7-7" />
  </svg>
);

// Pattern Icon
export const PatternIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg className={props.className} fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

// Yarn Icon
export const YarnIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg className={props.className} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <circle cx="12" cy="12" r="8" opacity="0.2" />
    <path d="M12 20a8 8 0 100-16 8 8 0 000 16z" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 14a2 2 0 100-4 2 2 0 000 4z" fill="currentColor" />
  </svg>
);

// Size Icon
export const SizeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
  </svg>
);
