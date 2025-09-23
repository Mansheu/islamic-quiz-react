import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}

export const TargetIcon: React.FC<IconProps> = ({ size = 20, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2"/>
    <circle cx="12" cy="12" r="2" fill={color}/>
  </svg>
);

export const TrophyIcon: React.FC<IconProps> = ({ size = 20, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M6 9c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v3.5c0 2.8-2.2 5-5 5h-2c-2.8 0-5-2.2-5-5V9z" stroke={color} strokeWidth="2"/>
    <path d="M6 9H4c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2h2" stroke={color} strokeWidth="2"/>
    <path d="M18 9h2c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2h-2" stroke={color} strokeWidth="2"/>
    <path d="M10 20h4" stroke={color} strokeWidth="2"/>
    <path d="M8 20h8" stroke={color} strokeWidth="2"/>
  </svg>
);

export const UserIcon: React.FC<IconProps> = ({ size = 20, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" stroke={color} strokeWidth="2"/>
    <path d="M12 14c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z" stroke={color} strokeWidth="2"/>
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ size = 20, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <polyline points="12,6 12,12 16,14" stroke={color} strokeWidth="2"/>
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ size = 20, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" stroke={color} strokeWidth="2"/>
    <path d="M8 2l.33 1L10 3.5l-1.67.5L8 6l-.33-1L6 4.5l1.67-.5L8 2z" stroke={color} strokeWidth="2"/>
    <path d="M18 6l.33 1L20 7.5l-1.67.5L18 10l-.33-1L16 8.5l1.67-.5L18 6z" stroke={color} strokeWidth="2"/>
  </svg>
);

export const BookIcon: React.FC<IconProps> = ({ size = 20, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke={color} strokeWidth="2"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke={color} strokeWidth="2"/>
  </svg>
);

export const ChartIcon: React.FC<IconProps> = ({ size = 20, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <polyline points="22,17 13.5,8.5 8.5,13.5 2,7" stroke={color} strokeWidth="2"/>
    <polyline points="16,17 22,17 22,11" stroke={color} strokeWidth="2"/>
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 20, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <polyline points="20,6 9,17 4,12" stroke={color} strokeWidth="2"/>
  </svg>
);

export const CrossIcon: React.FC<IconProps> = ({ size = 20, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="2"/>
    <line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2"/>
  </svg>
);

export const WarningIcon: React.FC<IconProps> = ({ size = 20, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={color} strokeWidth="2"/>
    <line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2"/>
    <circle cx="12" cy="17" r="1" fill={color}/>
  </svg>
);