import React from 'react';
import { useTimedChallengeStore, timedChallenges, getGradeColor } from '../store/timedChallenge';
import type { ChallengeResult } from '../types';
import './TimedLeaderboard.css';

export const TimedLeaderboard: React.FC = () => {
  const { personalBests, refreshPersonalBests } = useTimedChallengeStore();
  const hasRefreshed = React.useRef(false);

  // Debug logging to help troubleshoot the grade issue
  React.useEffect(() => {
    console.log('📊 Personal Bests Data:', personalBests);
    const allGrades = (Object.values(personalBests) as ChallengeResult[]).map(b => b.grade);
    console.log('🎯 All Grades:', allGrades);
    const gradeOrder = { S: 0, A: 1, B: 2, C: 3, D: 4 } as const;
    const bestGrade = allGrades.sort((a, b) => {
      return (gradeOrder[a as keyof typeof gradeOrder] ?? 5) - (gradeOrder[b as keyof typeof gradeOrder] ?? 5);
    })[0];
    console.log('⭐ Calculated Best Grade:', bestGrade);
    
    // Remove the auto-refresh to prevent infinite loop
    // refreshPersonalBests(); // This was causing infinite re-renders!
  }, [personalBests]); // Remove refreshPersonalBests from dependencies

  // Separate useEffect to refresh personal bests only on component mount
  React.useEffect(() => {
    if (!hasRefreshed.current) {
      console.log('🔄 Refreshing personal bests on component mount (one time only)');
      refreshPersonalBests();
      hasRefreshed.current = true;
    }
  }, [refreshPersonalBests]); // Include dependency but use ref to prevent multiple calls

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

  // Compute overall best grade across all personal bests (S > A > B > C > D)
  const bestGrade = React.useMemo(() => {
    const gradeOrder: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 };
    const grades = (Object.values(personalBests) as ChallengeResult[]).map(b => b.grade);
    if (grades.length === 0) return 'D';
    return grades.sort((a, b) => (gradeOrder[a] ?? 99) - (gradeOrder[b] ?? 99))[0];
  }, [personalBests]);

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
          const personalBest = personalBests[challenge.id] as ChallengeResult | undefined;
          
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
                  {Math.max(...(Object.values(personalBests) as ChallengeResult[]).map(b => b.score))} pts
                </span>
              </div>
            </div>
            <div className="overall-item">
              <span className="overall-icon">⭐</span>
              <div>
                <span className="overall-label">Best Grade</span>
                <span className="overall-value" style={{ color: getGradeColor(bestGrade) }}>{bestGrade}</span>
              </div>
            </div>
            <div className="overall-item">
              <span className="overall-icon">📈</span>
              <div>
                <span className="overall-label">Average Accuracy</span>
                <span className="overall-value">
                  {Math.round(
                    (Object.values(personalBests) as ChallengeResult[]).reduce((sum, b) => sum + b.accuracy, 0) / 
                    (Object.values(personalBests) as ChallengeResult[]).length
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
