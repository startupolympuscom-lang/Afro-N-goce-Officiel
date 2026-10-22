import React from 'react';

export function AfroNegoceLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <img 
      src="https://static.antigravity.dev/ais-dev-4tcsojdavubvzawayoov4m-94120260995/input_file_9.png" 
      alt="AFRO Négoce" 
      className={`${className} object-contain`}
      referrerPolicy="no-referrer"
    />
  );
}

export function AestheticFlame({ className = "w-6 h-6", color = "#2563eb" }: { className?: string, color?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <path 
        d="M12 2C12 2 7 7 7 12C7 14.7614 9.23858 17 12 17C14.7614 17 17 14.7614 17 12C17 7 12 2 12 2Z" 
        fill={color} 
      />
      <path 
        d="M12 6C12 6 9 9 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12C15 9 12 6 12 6Z" 
        fill="white" 
        fillOpacity="0.3"
      />
    </svg>
  );
}

// AFRO Négoce mark: white flame with a green core on a brand-blue tile (same artwork as the favicon).
export function BrandMark({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#0B5C9C" />
      <g transform="translate(0.8 7.3) scale(2.6)">
        <path d="M12 2C12 2 7 7 7 12C7 14.7614 9.23858 17 12 17C14.7614 17 17 14.7614 17 12C17 7 12 2 12 2Z" fill="#FFFFFF" />
        <path d="M12 6C12 6 9 9 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12C15 9 12 6 12 6Z" fill="#8CC63F" />
      </g>
    </svg>
  );
}
