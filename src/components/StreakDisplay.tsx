import React from 'react';
import type { DailyStreak } from '../types/achievements';
import './StreakDisplay.css';

interface StreakDisplayProps {
  streak: DailyStreak | null;
  size?: 'small' | 'medium' | 'large';
  showHistory?: boolean;
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({
  streak,
  size = 'medium',
  showHistory = false
}) => {
  if (!streak) {
    return (
      <div className={`streak-display ${size} no-streak`}>
        <div className="streak-icon">🔥</div>
        <div className="streak-info">
          <h3 className="streak-number">0</h3>
          <p className="streak-label">Start your streak!</p>
        </div>
      </div>
    );
  }

  const getStreakEmoji = (days: number): string => {
    if (days >= 100) return '💎';
    if (days >= 30) return '🌟';
    if (days >= 7) return '⚡';
    if (days >= 3) return '🔥';
    if (days >= 1) return '🌱';
    return '😴';
  };

  const getStreakMessage = (days: number): string => {
    if (days >= 100) return 'Legendary streak!';
    if (days >= 30) return 'Amazing consistency!';
    if (days >= 7) return 'Week strong!';
    if (days >= 3) return 'Building momentum!';
    if (days >= 1) return 'Keep it up!';
    return 'Start today!';
  };

  const isStreakActive = (): boolean => {
    if (!streak.lastActiveDate) return false;
    const today = new Date();
    const lastActive = new Date(streak.lastActiveDate);
    
    // Set both to start of day for comparison
    today.setHours(0, 0, 0, 0);
    lastActive.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - lastActive.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 1; // Active if studied today or yesterday
  };

  const getRecentDays = (): boolean[] => {
    if (!streak.streakHistory) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const recentDays: boolean[] = [];
    
    // Show last 7 days
    for (let i = 6; i >= 0; i--) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const hasActivity = streak.streakHistory.some(date => {
        const activityDate = new Date(date);
        activityDate.setHours(0, 0, 0, 0);
        return activityDate.getTime() === checkDate.getTime();
      });
      
      recentDays.push(hasActivity);
    }
    
    return recentDays;
  };

  const streakActive = isStreakActive();
  const recentDays = showHistory ? getRecentDays() : [];

  return (
    <div className={`streak-display ${size} ${streakActive ? 'active' : 'inactive'}`}>
      <div className="streak-main">
        <div className="streak-icon">
          <span className="emoji">{getStreakEmoji(streak.currentStreak)}</span>
          {streakActive && <div className="fire-glow" />}
        </div>
        
        <div className="streak-info">
          <h3 className="streak-number">
            {streak.currentStreak}
            <span className="streak-unit">day{streak.currentStreak !== 1 ? 's' : ''}</span>
          </h3>
          <p className="streak-label">{getStreakMessage(streak.currentStreak)}</p>
          
          {streak.longestStreak > streak.currentStreak && (
            <p className="longest-streak">
              Best: {streak.longestStreak} day{streak.longestStreak !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
      
      {showHistory && recentDays.length > 0 && (
        <div className="streak-history">
          <h4 className="history-title">Last 7 days</h4>
          <div className="history-grid">
            {recentDays.map((hasActivity, index) => {
              const date = new Date();
              date.setDate(date.getDate() - (6 - index));
              const dayName = date.toLocaleDateString('en', { weekday: 'short' });
              
              return (
                <div 
                  key={index}
                  className={`history-day ${hasActivity ? 'active' : 'inactive'}`}
                  title={`${dayName}, ${date.toLocaleDateString()}`}
                >
                  <span className="day-name">{dayName}</span>
                  <div className={`day-indicator ${hasActivity ? 'completed' : 'missed'}`} />
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {!streakActive && streak.currentStreak > 0 && (
        <div className="streak-warning">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">Study today to maintain your streak!</span>
        </div>
      )}
    </div>
  );
};

export default StreakDisplay;