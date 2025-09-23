import React from 'react';
import { useTimedChallengeStore, timedChallenges, getGradeColor } from '../store/timedChallenge';
import './TimedLeaderboard.css';

export const TimedLeaderboard: React.FC = () => {
  const { personalBests } = useTimedChallengeStore();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="timed-leaderboard">
      <div className="leaderboard-header">
        <h1>🏆 Timed Challenge Records</h1>
        <p className="leaderboard-subtitle">
          Your personal best scores for each challenge
        </p>
      </div>

      <div className="records-grid">
        {timedChallenges.map((challenge) => {
          const personalBest = personalBests[challenge.id];
          
          return (
            <div key={challenge.id} className="record-card">
              <div className="record-header">
                <div className="challenge-info">
                  <span className="challenge-icon-large">{challenge.icon}</span>
                  <div>
                    <h3 className="record-title">{challenge.name}</h3>
                    <p className="record-meta">
                      {challenge.questionCount} questions • {formatTime(challenge.timeLimit)} • {challenge.scoreMultiplier}x
                    </p>
                  </div>
                </div>
              </div>

              <div className="record-content">
                {personalBest ? (
                  <>
                    <div className="record-grade">
                      <div 
                        className="grade-badge"
                        style={{ 
                          backgroundColor: getGradeColor(personalBest.grade),
                          color: personalBest.grade === 'S' || personalBest.grade === 'A' ? '#000' : '#fff'
                        }}
                      >
                        {personalBest.grade}
                      </div>
                      <div className="grade-details">
                        <span className="grade-score">{personalBest.score} pts</span>
                        <span className="grade-accuracy">{personalBest.accuracy}% accuracy</span>
                      </div>
                    </div>

                    <div className="record-stats">
                      <div className="record-stat">
                        <span className="stat-icon">✅</span>
                        <div>
                          <span className="stat-label">Correct</span>
                          <span className="stat-value">
                            {personalBest.correctAnswers}/{personalBest.totalQuestions}
                          </span>
                        </div>
                      </div>
                      <div className="record-stat">
                        <span className="stat-icon">⏱️</span>
                        <div>
                          <span className="stat-label">Time</span>
                          <span className="stat-value">
                            {formatTime(personalBest.timeSpent)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="record-footer">
                      <span className="record-date">
                        🗓️ {formatDate(personalBest.completedAt)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="no-record">
                    <span className="no-record-icon">🎯</span>
                    <p className="no-record-text">No attempts yet</p>
                    <p className="no-record-sub">Take this challenge to set your record!</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {Object.keys(personalBests).length > 0 && (
        <div className="overall-stats">
          <h2>📊 Overall Statistics</h2>
          <div className="overall-grid">
            <div className="overall-item">
              <span className="overall-icon">🎮</span>
              <div>
                <span className="overall-label">Challenges Completed</span>
                <span className="overall-value">{Object.keys(personalBests).length}</span>
              </div>
            </div>
            <div className="overall-item">
              <span className="overall-icon">🏆</span>
              <div>
                <span className="overall-label">Highest Score</span>
                <span className="overall-value">
                  {Math.max(...Object.values(personalBests).map(best => best.score))} pts
                </span>
              </div>
            </div>
            <div className="overall-item">
              <span className="overall-icon">⭐</span>
              <div>
                <span className="overall-label">Best Grade</span>
                <span 
                  className="overall-value"
                  style={{ 
                    color: getGradeColor(
                      Object.values(personalBests)
                        .map(best => best.grade)
                        .sort((a, b) => {
                          const order = { 'S': 0, 'A': 1, 'B': 2, 'C': 3, 'D': 4 };
                          return (order[a as keyof typeof order] || 5) - (order[b as keyof typeof order] || 5);
                        })[0]
                    )
                  }}
                >
                  {Object.values(personalBests)
                    .map(best => best.grade)
                    .sort((a, b) => {
                      const order = { 'S': 0, 'A': 1, 'B': 2, 'C': 3, 'D': 4 };
                      return (order[a as keyof typeof order] || 5) - (order[b as keyof typeof order] || 5);
                    })[0]}
                </span>
              </div>
            </div>
            <div className="overall-item">
              <span className="overall-icon">📈</span>
              <div>
                <span className="overall-label">Average Accuracy</span>
                <span className="overall-value">
                  {Math.round(
                    Object.values(personalBests).reduce((sum, best) => sum + best.accuracy, 0) / 
                    Object.values(personalBests).length
                  )}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {Object.keys(personalBests).length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🎯</span>
          <h3>No records yet!</h3>
          <p>Complete timed challenges to see your personal bests here.</p>
        </div>
      )}
    </div>
  );
};

export default TimedLeaderboard;
