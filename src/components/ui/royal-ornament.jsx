import React from "react";

export function SectionDivider({ className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <div className="h-px w-16 md:w-24 bg-gradient-to-r from-transparent to-primary/40" />
      <svg width="20" height="20" viewBox="0 0 20 20" className="text-primary/50">
        <path
          d="M10 2 L12 8 L18 10 L12 12 L10 18 L8 12 L2 10 L8 8 Z"
          fill="currentColor"
        />
      </svg>
      <div className="h-px w-16 md:w-24 bg-gradient-to-l from-transparent to-primary/40" />
    </div>
  );
}

export function CornerOrnament({ position = "top-right", className = "" }) {
  const positionClasses = {
    "top-left": "top-0 left-0",
    "top-right": "top-0 right-0 -scale-x-100",
    "bottom-left": "bottom-0 left-0 -scale-y-100",
    "bottom-right": "bottom-0 right-0 -scale-x-100 -scale-y-100",
  };

  return (
    <svg
      width="60"
      height="60"
      viewBox="0 0 60 60"
      className={`absolute ${positionClasses[position]} text-primary/15 pointer-events-none ${className}`}
    >
      <path
        d="M0 0 L40 0 Q35 5 30 5 L5 5 Q5 5 5 30 Q5 35 0 40 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle cx="8" cy="8" r="2" fill="currentColor" />
    </svg>
  );
}

export function CrownOrnament({ className = "" }) {
  return (
    <svg width="32" height="24" viewBox="0 0 32 24" className={`text-primary/40 ${className}`}>
      <path
        d="M2 20 L6 8 L10 14 L16 4 L22 14 L26 8 L30 20 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line x1="4" y1="22" x2="28" y2="22" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
