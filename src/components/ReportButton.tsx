import React, { useState } from 'react';
import './ReportButton.css';

interface ReportButtonProps {
  onReport: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const ReportButton: React.FC<ReportButtonProps> = ({
  onReport,
  disabled = false,
  size = 'medium',
  className = ''
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    
    setIsAnimating(true);
    onReport();
    
    // Reset animation after a short delay
    setTimeout(() => setIsAnimating(false), 300);
  };

  const buttonClasses = [
    'report-button',
    `report-button--${size}`,
    isAnimating ? 'report-button--animating' : '',
    disabled ? 'report-button--disabled' : '',
    className
  ].filter(Boolean).join(' ');

  const ariaLabel = 'Report this question';
  const title = 'Flag this question for review';

  return (
    <button
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      type="button"
    >
      <span className="report-button__icon" aria-hidden="true">
        {/* Flag/Report icon */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
          <line x1="4" y1="22" x2="4" y2="15"/>
        </svg>
      </span>
    </button>
  );
};

export default ReportButton;