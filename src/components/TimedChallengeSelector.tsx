import React from 'react';
import { timedChallenges, useTimedChallengeStore, getGradeColor } from '../store/timedChallenge';
import './TimedChallengeSelector.css';

interface TimedChallengeSelectorProps {
  isGuestMode?: boolean;
}

export const TimedChallengeSelector: React.FC<TimedChallengeSelectorProps> = ({ isGuestMode = false }) => {
  const { startChallenge, getPersonalBest } = useTimedChallengeStore();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <div className="timed-challenge-selector">
      <div className="selector-header">
        <h1>⏱️ Timed Challenges</h1>
        <p className="selector-subtitle">
          Test your knowledge under pressure! Complete challenges quickly for bonus points.
        </p>
        
        {isGuestMode && (
          <div style={{ 
            background: '#fff3cd', 
            color: '#856404', 
            padding: '12px', 
            borderRadius: '8px', 
            margin: '16px 0',
            border: '1px solid #ffeaa7',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            👤 <strong>Guest Mode:</strong> Your challenge scores won't be saved or appear on leaderboards. Sign in to track your records!
          </div>
        )}
      </div>

      <div className="challenges-grid">
        {timedChallenges.map((challenge) => {
          const personalBest = getPersonalBest(challenge.id);
          
          return (
            <div key={challenge.id} className="challenge-card">
              <div className="challenge-header">
                <div className="challenge-icon">{challenge.icon}</div>
                <div className="challenge-title-section">
                  <h3 className="challenge-title">{challenge.name}</h3>
                  <div 
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(challenge.difficulty) }}
                  >
                    {challenge.difficulty}
                  </div>
                </div>
              </div>

              <div className="challenge-content">
                <p className="challenge-description">{challenge.description}</p>

                <div className="challenge-stats">
                  <div className="stat-row">
                    <div className="stat-item">
                      <span className="stat-icon">⏰</span>
                      <div>
                        <span className="stat-label">Time Limit</span>
                        <span className="stat-value">{formatTime(challenge.timeLimit)}</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">❓</span>
                      <div>
                        <span className="stat-label">Questions</span>
                        <span className="stat-value">{challenge.questionCount}</span>
                      </div>
                    </div>
                  </div>
                  <div className="stat-row">
                    <div className="stat-item">
                      <span className="stat-icon">✨</span>
                      <div>
                        <span className="stat-label">Multiplier</span>
                        <span className="stat-value">{challenge.scoreMultiplier}x</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">📖</span>
                      <div>
                        <span className="stat-label">Topic</span>
                        <span className="stat-value">{challenge.topic}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {personalBest && (
                  <div className="personal-best">
                    <h4>🏆 Personal Best</h4>
                    <div className="best-stats">
                      <div className="best-item">
                        <div>Score</div>
                        <strong>{personalBest.score}</strong>
                      </div>
                      <div className="best-item">
                        <div>Grade</div>
                        <strong style={{ color: getGradeColor(personalBest.grade) }}>
                          {personalBest.grade}
                        </strong>
                      </div>
                      <div className="best-item">
                        <div>Accuracy</div>
                        <strong>{personalBest.accuracy}%</strong>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bonus-info">
                  <span className="bonus-icon">💡</span>
                  <span className="bonus-text">
                    Speed bonus: Finish quickly for extra points!
                  </span>
                </div>

                <div className="challenge-actions">
                  <button 
                    className="challenge-btn"
                    onClick={() => startChallenge(challenge.id, isGuestMode)}
                  >
                    <span className="btn-icon">🚀</span>
                    Start Challenge
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="challenge-tips">
        <h3>💡 Pro Tips</h3>
        <div className="tips-grid">
          <div className="tip-item">
            <span className="tip-icon">⚡</span>
            <span>Answer quickly but accurately for maximum points</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">🎯</span>
            <span>Build streaks for bonus multipliers</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">📈</span>
            <span>Higher difficulty = higher score potential</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">🏆</span>
            <span>Aim for S-grade (180+ points) for ultimate bragging rights</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimedChallengeSelector;
