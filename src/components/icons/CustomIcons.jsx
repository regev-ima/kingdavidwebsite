import React from "react";

// ===== USP Icons =====

export function TrialNightIcon({ className = "w-16 h-16" }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <path d="M50 18c-1.5-1-3.2-1.7-5-2.1A18 18 0 0025 34a18 18 0 0020 17.9c-1.8-.4-3.5-1.1-5-2.1A14 14 0 0128 34a14 14 0 0122-16z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="56" cy="22" r="8" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M56 17v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M32 56c0-3 2.5-5.5 5.5-5.5 1.3 0 2.5.5 3.4 1.2A6.5 6.5 0 0153.5 56h0a4.5 4.5 0 010 9h-17a4 4 0 01-4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export function FactoryIcon({ className = "w-16 h-16" }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <rect x="12" y="32" width="56" height="32" rx="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M22 32V18a3 3 0 013-3h8a3 3 0 013 3v14" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M28 15c0-4 3-6 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M28 13c-1.5-3-4-4-6-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="32" y="48" width="16" height="16" rx="8" stroke="currentColor" strokeWidth="1.8"/>
      <rect x="18" y="39" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="54" y="39" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M58 20l4.5 2.6v5.2L58 30.4l-4.5-2.6v-5.2L58 20z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M55.5 23.5L58 25l2.5-1.5M58 25v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

export function ModelsIcon({ className = "w-16 h-16" }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <rect x="14" y="44" width="52" height="12" rx="4" stroke="currentColor" strokeWidth="1.8"/>
      <rect x="18" y="34" width="44" height="12" rx="4" stroke="currentColor" strokeWidth="1.8"/>
      <rect x="22" y="24" width="36" height="12" rx="4" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M30 28c0 2.5 2.5 5 5 5s5-2.5 5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M42 28c0 2.5 2.5 5 5 5s5-2.5 5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M14 62h52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 4"/>
    </svg>
  );
}

export function WarrantyBadgeIcon({ className = "w-16 h-16" }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <circle cx="40" cy="34" r="18" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="40" cy="34" r="13" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 3"/>
      <path d="M40 25l2.9 5.9 6.5 1-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5-4.7-4.6 6.5-1L40 25z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M30 56l3.5-7 5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M50 56l-3.5-7-5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ===== Technology Icons =====

export function ComfortZoneIcon({ className = "w-16 h-16" }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      {/* Body silhouette lying on mattress zones */}
      <rect x="10" y="50" width="60" height="14" rx="4" stroke="currentColor" strokeWidth="1.8"/>
      {/* 5 zone dividers */}
      <path d="M22 50v14M34 50v14M46 50v14M58 50v14" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.5"/>
      {/* Pressure points / body curve */}
      <path d="M16 48c2-8 4-14 8-16s8-1 10 2c2 3 4 4 6 4s4-1 6-4c2-3 6-4 10-2s6 8 8 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      {/* Support arrows */}
      <path d="M16 46v-4M28 40v-4M40 38v-4M52 40v-4M64 46v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="16" cy="41" r="1.5" fill="currentColor"/>
      <circle cx="28" cy="35" r="1.5" fill="currentColor"/>
      <circle cx="40" cy="33" r="1.5" fill="currentColor"/>
      <circle cx="52" cy="35" r="1.5" fill="currentColor"/>
      <circle cx="64" cy="41" r="1.5" fill="currentColor"/>
      {/* 5D label */}
      <text x="40" y="60" textAnchor="middle" fontSize="8" fill="currentColor" fontWeight="700" fontFamily="sans-serif">5D</text>
    </svg>
  );
}

export function CircuTechIcon({ className = "w-16 h-16" }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      {/* Central blood drop / circulation symbol */}
      <circle cx="40" cy="40" r="22" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="40" cy="40" r="14" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3"/>
      {/* Flow arrows around the circle */}
      <path d="M40 14c-1 0-2 .1-3 .2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M62 40c0-1-.1-2-.2-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M40 66c1 0 2-.1 3-.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M18 40c0 1 .1 2 .2 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      {/* Inner circulation pattern */}
      <path d="M40 30c-3 0-6 2-6 6s4 4 6 8c2-4 6-4 6-8s-3-6-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      {/* Tiny dots representing contact points */}
      <circle cx="30" cy="34" r="1.2" fill="currentColor"/>
      <circle cx="50" cy="34" r="1.2" fill="currentColor"/>
      <circle cx="34" cy="50" r="1.2" fill="currentColor"/>
      <circle cx="46" cy="50" r="1.2" fill="currentColor"/>
      <circle cx="32" cy="42" r="1" fill="currentColor"/>
      <circle cx="48" cy="42" r="1" fill="currentColor"/>
    </svg>
  );
}

export function BalanceIcon({ className = "w-16 h-16" }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      {/* Spine / central axis */}
      <path d="M40 14v48" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      {/* Balance beam */}
      <path d="M18 30h44" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      {/* Left pan */}
      <path d="M18 30l-4 16h20l-4-16" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M14 46c0 2 4 4 10 4s10-2 10-4" stroke="currentColor" strokeWidth="1.5"/>
      {/* Right pan */}
      <path d="M50 30l-4 16h20l-4-16" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M46 46c0 2 4 4 10 4s10-2 10-4" stroke="currentColor" strokeWidth="1.5"/>
      {/* Base / fulcrum */}
      <path d="M34 62h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="40" cy="26" r="4" stroke="currentColor" strokeWidth="1.5"/>
      {/* Equal signs in pans */}
      <path d="M21 39h10M21 42h10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
      <path d="M53 39h10M53 42h10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
    </svg>
  );
}

export function DeliveryTruckIcon({ className = "w-16 h-16" }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className}>
      <rect x="8" y="26" width="36" height="26" rx="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M44 36h12a3 3 0 012.7 1.7l4.3 8.6a3 3 0 01.3 1.3v4.4a3 3 0 01-3 3H60" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M44 36v16" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="22" cy="54" r="5" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="22" cy="54" r="2" fill="currentColor"/>
      <circle cx="54" cy="54" r="5" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="54" cy="54" r="2" fill="currentColor"/>
      <circle cx="54" cy="20" r="8" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M50 20l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
