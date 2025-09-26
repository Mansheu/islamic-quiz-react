import React from 'react';
import type { Achievement } from '../types/achievements';
import { RARITY_COLORS } from '../types/achievements';
import './AchievementBadge.css';

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  onClick?: () => void;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  size = 'medium',
  showProgress = true,
  onClick
}) => {
  const progressPercentage = achievement.isUnlocked 
    ? 100 
    : Math.round(((achievement.progress || 0) / achievement.requirement) * 100);

  const rarityColor = RARITY_COLORS[achievement.rarity];

  return (
    <div 
      className={`achievement-badge ${size} ${achievement.rarity} ${achievement.isUnlocked ? 'unlocked' : 'locked'}`}
      onClick={onClick}
      style={{ '--rarity-color': rarityColor } as React.CSSProperties}
    >
      <div className="badge-inner">
        <div className="badge-icon">
          <span className="icon">{achievement.icon}</span>
          {achievement.isUnlocked && (
            <div className="unlock-indicator">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 12l2 2 4-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
        
        <div className="badge-content">
          <h4 className="badge-title">{achievement.name}</h4>
          <p className="badge-description">{achievement.description}</p>
          
          {showProgress && !achievement.isUnlocked && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="progress-text">
                {achievement.progress || 0} / {achievement.requirement}
              </span>
            </div>
          )}
          
          {achievement.isUnlocked && achievement.unlockedAt && (
            <div className="unlock-date">
              Unlocked {achievement.unlockedAt instanceof Date && !isNaN(achievement.unlockedAt.getTime()) 
                ? achievement.unlockedAt.toLocaleDateString()
                : 'recently'
              }
            </div>
          )}
          
          <div className="badge-rarity">
            {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
          </div>
        </div>
      </div>
      
      {achievement.isUnlocked && (
        <div className="unlock-glow" />
      )}
    </div>
  );
};

export default AchievementBadge;