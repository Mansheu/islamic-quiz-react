import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import { getUserAchievements, subscribeToUserAchievements, getUserDailyStreak, subscribeToUserDailyStreak } from '../firebase/achievements';
import AchievementBadge from './AchievementBadge';
import StreakDisplay from './StreakDisplay';
import { ACHIEVEMENT_DEFINITIONS } from '../types/achievements';
import type { UserAchievements, DailyStreak } from '../types/achievements';
import './AchievementDashboard.css';

const AchievementDashboard: React.FC = () => {
  const [user] = useAuthState(auth);
  const [userAchievements, setUserAchievements] = useState<UserAchievements | null>(null);
  const [dailyStreak, setDailyStreak] = useState<DailyStreak | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadAchievements = async () => {
      try {
        setLoading(true);
        const [achievements, streak] = await Promise.all([
          getUserAchievements(user.uid),
          getUserDailyStreak(user.uid)
        ]);
        setUserAchievements(achievements);
        setDailyStreak(streak);
      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        setLoading(false);
      }
    };

    // Load initial data
    loadAchievements();

    // Subscribe to real-time updates
    const unsubscribeAchievements = subscribeToUserAchievements(user.uid, (achievements) => {
      setUserAchievements(achievements);
    });
    
    const unsubscribeStreak = subscribeToUserDailyStreak(user.uid, (streak) => {
      setDailyStreak(streak);
    });

    return () => {
      if (unsubscribeAchievements) unsubscribeAchievements();
      if (unsubscribeStreak) unsubscribeStreak();
    };
  }, [user]);

  const categories = ['all', 'questions', 'streaks', 'accuracy', 'topics', 'speed', 'special'];
  
  const filteredAchievements = selectedCategory === 'all' 
    ? (userAchievements?.achievements || [])
    : (userAchievements?.achievements.filter(achievement => achievement.category === selectedCategory) || []);

  const getStatistics = () => {
    if (!userAchievements) return { unlocked: 0, total: 0, percentage: 0 };
    
    const unlocked = userAchievements.achievements.filter(a => a.isUnlocked).length;
    const total = ACHIEVEMENT_DEFINITIONS.length;
    const percentage = Math.round((unlocked / total) * 100);
    
    return { unlocked, total, percentage };
  };

  const stats = getStatistics();

  if (loading) {
    return (
      <div className="achievement-dashboard">
        <div className="loading-spinner">
          <div className="loader-1">
            <svg width="64px" height="48px" viewBox="0 0 64 48">
              <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" className="back-line"></polyline>
              <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" className="front-line"></polyline>
            </svg>
          </div>
          <p>Loading achievements...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="achievement-dashboard">
        <div className="auth-required">
          <h2>🔐 Authentication Required</h2>
          <p>Please sign in to view your achievements and progress.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="achievement-dashboard">
      <div className="dashboard-header">
        <h1>
          <span className="emoji" role="img" aria-label="trophy">🏆</span>
          <span className="title-text"> Achievement Dashboard</span>
        </h1>
        <div className="overall-progress">
          <h2>Overall Progress</h2>
          <div className="progress-stats">
            <div className="stat-item">
              <span className="stat-number">{stats.unlocked}</span>
              <span className="stat-label">Unlocked</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.percentage}%</span>
              <span className="stat-label">Complete</span>
            </div>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${stats.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="streak-section">
        <h2>🔥 Daily Streak</h2>
        <StreakDisplay 
          streak={dailyStreak || {
            userId: user.uid,
            currentStreak: userAchievements?.currentStreak || 0,
            longestStreak: userAchievements?.longestStreak || 0,
            lastActiveDate: userAchievements?.lastQuizDate || new Date(),
            streakHistory: []
          }}
          size="large"
          showHistory={true}
        />
      </div>

      <div className="achievements-section">
        <div className="section-header">
          <h2>🎖️ Achievements</h2>
          <div className="category-filter">
            {categories.map(category => (
              <button
                key={category}
                className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="achievements-grid">
          {filteredAchievements.map(achievement => (
            <div key={achievement.id} className="achievement-item">
              <AchievementBadge
                achievement={achievement}
                size="large"
                showProgress={!achievement.isUnlocked}
              />
            </div>
          ))}
        </div>
      </div>

      {userAchievements && (
        <div className="detailed-stats">
          <h2>📊 Detailed Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Quiz Performance</h3>
              <div className="stat-row">
                <span>Questions Answered:</span>
                <span className="stat-value">{userAchievements.totalQuestionsAnswered}</span>
              </div>
              <div className="stat-row">
                <span>Correct Answers:</span>
                <span className="stat-value">{userAchievements.totalCorrectAnswers}</span>
              </div>
              <div className="stat-row">
                <span>Accuracy Rate:</span>
                <span className="stat-value">
                  {userAchievements.totalQuestionsAnswered > 0 
                    ? Math.round((userAchievements.totalCorrectAnswers / userAchievements.totalQuestionsAnswered) * 100)
                    : 0}%
                </span>
              </div>
            </div>

            <div className="stat-card">
              <h3>Streak Information</h3>
              <div className="stat-row">
                <span>Current Streak:</span>
                <span className="stat-value">{dailyStreak?.currentStreak || 0} days</span>
              </div>
              <div className="stat-row">
                <span>Longest Streak:</span>
                <span className="stat-value">{dailyStreak?.longestStreak || 0} days</span>
              </div>
              <div className="stat-row">
                <span>Perfect Scores:</span>
                <span className="stat-value">{userAchievements.perfectScores}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementDashboard;
