import React, { useState, useEffect, useCallback } from 'react';
import type { Achievement } from '../types/achievements';
import './AchievementNotification.css';

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
  duration?: number;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onClose,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    // Show notification with slight delay
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Auto-hide after duration
    const hideTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, handleClose]);

  return (
    <div className={`achievement-notification ${isVisible ? 'visible' : ''} ${isLeaving ? 'leaving' : ''}`}>
      <div className="notification-content">
        <div className="notification-header">
          <div className="header-icon">🏆</div>
          <div className="header-text">
            <span className="achievement-unlocked">Achievement Unlocked!</span>
            <span className={`rarity-badge ${achievement.rarity}`}>
              {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
            </span>
          </div>
          <button 
            className="close-btn"
            onClick={handleClose}
            aria-label="Close notification"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        
        <div className="notification-body">
          <div className="achievement-icon">
            <span className="icon">{achievement.icon}</span>
            <div className="icon-glow" />
          </div>
          
          <div className="achievement-info">
            <h3 className="achievement-name">{achievement.name}</h3>
            <p className="achievement-desc">{achievement.description}</p>
          </div>
        </div>
        
        <div className="notification-footer">
          <div className="sparkles">
            <span className="sparkle">✨</span>
            <span className="sparkle">⭐</span>
            <span className="sparkle">✨</span>
          </div>
        </div>
      </div>
      
      <div className="notification-background" />
    </div>
  );
};

export default AchievementNotification;