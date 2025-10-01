import React, { useState, useEffect, useCallback } from 'react';
import './InlineNotification.css';

export type NotificationType = 'success' | 'error';

export interface InlineNotificationProps {
  type: NotificationType;
  message: string;
  isVisible: boolean;
  onDismiss: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  showIcon?: boolean;
  showCloseButton?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const InlineNotification: React.FC<InlineNotificationProps> = ({
  type,
  message,
  isVisible,
  onDismiss,
  autoClose = true,
  autoCloseDelay = 4000,
  showIcon = true,
  showCloseButton = true,
  className = '',
  children
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsAnimating(false);
    // Small delay to allow exit animation
    setTimeout(() => {
      onDismiss();
    }, 200);
  }, [onDismiss]);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      
      // Auto-close only for success messages if autoClose is enabled
      if (autoClose && type === 'success') {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoCloseDelay);

        return () => clearTimeout(timer);
      }
    } else {
      setIsAnimating(false);
    }
  }, [isVisible, autoClose, autoCloseDelay, type, handleDismiss]);

  if (!isVisible && !isAnimating) {
    return null;
  }

  const notificationClasses = [
    'inline-notification',
    `inline-notification--${type}`,
    isVisible ? 'inline-notification--visible' : 'inline-notification--hidden',
    className
  ].filter(Boolean).join(' ');

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        );
      case 'error':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className={notificationClasses}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="inline-notification__content">
        {showIcon && (
          <div className="inline-notification__icon" aria-hidden="true">
            {getIcon()}
          </div>
        )}
        
        <div className="inline-notification__message">
          {message}
          {children && (
            <div className="inline-notification__children">
              {children}
            </div>
          )}
        </div>
        
        {showCloseButton && (
          <button
            className="inline-notification__close"
            onClick={handleDismiss}
            aria-label={`Dismiss ${type} notification`}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default InlineNotification;