import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}

export const LightningIcon: React.FC<IconProps> = ({ size = 20, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill={color}/>
  </svg>
);

export const StarIcon: React.FC<IconProps> = ({ size = 20, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <polygon points="12,2 15.09,8.26 22,9 17,14.74 18.18,21.02 12,17.77 5.82,21.02 7,14.74 2,9 8.91,8.26" stroke={color} strokeWidth="2" fill={color}/>
  </svg>
);

export const CelebrationIcon: React.FC<IconProps> = ({ size = 20, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M8 12l-2-2-2 2 2 2 2-2z" fill={color}/>
    <path d="M18 12l-2-2-2 2 2 2 2-2z" fill={color}/>
    <path d="M12 8l-2-2-2 2 2 2 2-2z" fill={color}/>
    <path d="M12 18l-2-2-2 2 2 2 2-2z" fill={color}/>
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2"/>
    <path d="M7.5 7.5l-1-1" stroke={color} strokeWidth="2"/>
    <path d="M17.5 7.5l1-1" stroke={color} strokeWidth="2"/>
    <path d="M7.5 16.5l-1 1" stroke={color} strokeWidth="2"/>
    <path d="M17.5 16.5l1 1" stroke={color} strokeWidth="2"/>
  </svg>
);

export const BooksIcon: React.FC<IconProps> = ({ size = 20, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke={color} strokeWidth="2"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke={color} strokeWidth="2"/>
  </svg>
);

export const PrayingHandsIcon: React.FC<IconProps> = ({ size = 20, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 5.5c-1.5-2.5-4-3-6-2.5-2 .5-3 2-3 4s1 3.5 3 4c1 .25 2-.25 3-1.5" stroke={color} strokeWidth="2"/>
    <path d="M12 5.5c1.5-2.5 4-3 6-2.5 2 .5 3 2 3 4s-1 3.5-3 4c-1 .25-2-.25-3-1.5" stroke={color} strokeWidth="2"/>
    <path d="M12 5.5v13" stroke={color} strokeWidth="2"/>
    <path d="M10 18.5c-1 1.25-2 1.75-3 1.5-2-.5-3-2-3-4s1-3.5 3-4" stroke={color} strokeWidth="2"/>
    <path d="M14 18.5c1 1.25 2 1.75 3 1.5 2-.5 3-2 3-4s-1-3.5-3-4" stroke={color} strokeWidth="2"/>
  </svg>
);

export const GameControllerIcon: React.FC<IconProps> = ({ size = 20, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M6 14h4m-2-2v4m6-1h.01M17 12h.01" stroke={color} strokeWidth="2"/>
    <rect x="2" y="10" width="20" height="8" rx="4" stroke={color} strokeWidth="2"/>
  </svg>
);

export const ClipboardIcon: React.FC<IconProps> = ({ size = 20, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke={color} strokeWidth="2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke={color} strokeWidth="2"/>
  </svg>
);

export const ChartBarIcon: React.FC<IconProps> = ({ size = 20, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth="2"/>
    <rect x="7" y="8" width="2" height="8" fill={color}/>
    <rect x="11" y="6" width="2" height="10" fill={color}/>
    <rect x="15" y="10" width="2" height="6" fill={color}/>
  </svg>
);

export const MosqueIcon: React.FC<IconProps> = ({ size = 20, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2l4 6h4v12H4V8h4l4-6z" stroke={color} strokeWidth="2"/>
    <circle cx="12" cy="5" r="1" fill={color}/>
    <rect x="8" y="12" width="2" height="6" fill={color}/>
    <rect x="14" y="12" width="2" height="6" fill={color}/>
    <path d="M6 8c0-2 2-4 6-4s6 2 6 4" stroke={color} strokeWidth="2"/>
  </svg>
);