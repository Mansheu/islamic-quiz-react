import React, { useState } from 'react';
import './BookmarkButton.css';

interface BookmarkButtonProps {
  isBookmarked: boolean;
  onToggle: () => Promise<void>;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  isBookmarked,
  onToggle,
  disabled = false,
  size = 'medium',
  showLabel = false,
  className = ''
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    setIsAnimating(true);
    
    try {
      await onToggle();
    } catch (error) {
      console.error('Bookmark toggle failed:', error);
    } finally {
      setIsLoading(false);
      // Keep animation for a bit longer for better visual feedback
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const buttonClasses = [
    'bookmark-button',
    `bookmark-button--${size}`,
    isBookmarked ? 'bookmark-button--bookmarked' : 'bookmark-button--unbookmarked',
    isAnimating ? 'bookmark-button--animating' : '',
    isLoading ? 'bookmark-button--loading' : '',
    disabled ? 'bookmark-button--disabled' : '',
    className
  ].filter(Boolean).join(' ');

  const ariaLabel = isBookmarked ? 'Remove from bookmarks' : 'Save to bookmarks';
  const title = isBookmarked ? 'Remove from Review Later' : 'Save to Review Later';

  return (
    <button
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      title={title}
      type="button"
    >
      <span className="bookmark-button__icon" aria-hidden="true">
        {isBookmarked ? (
          // Filled bookmark icon (saved)
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        ) : (
          // Outline bookmark icon (not saved)
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </span>
      {showLabel && (
        <span className="bookmark-button__label">
          {isBookmarked ? 'Saved' : 'Save'}
        </span>
      )}
      {isLoading && (
        <span className="bookmark-button__spinner" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24">
            <circle 
              cx="12" 
              cy="12" 
              r="10" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              strokeDasharray="31.416"
              strokeDashoffset="31.416"
            >
              <animate 
                attributeName="strokeDasharray" 
                dur="2s" 
                values="0 31.416;15.708 15.708;0 31.416;15.708 15.708;0 31.416" 
                repeatCount="indefinite"
              />
              <animate 
                attributeName="strokeDashoffset" 
                dur="2s" 
                values="0;-15.708;-31.416;-47.124;-62.832" 
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        </span>
      )}
    </button>
  );
};

export default BookmarkButton;