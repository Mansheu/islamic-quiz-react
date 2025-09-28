import React, { useState, useEffect } from 'react';
import { useTimedChallengeStore, getGradeColor } from '../store/timedChallenge';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import { updateUserTimedChallengeResults } from '../firebase/auth';
import { GuestScoreNotification } from './GuestScoreNotification';
import CustomLoader from './CustomLoader';
import './ChallengeResults.css';

interface ChallengeResultsProps {
  onTryAnother?: () => void;
}

export const ChallengeResults: React.FC<ChallengeResultsProps> = ({ onTryAnother }) => {
  const { results, resetChallenge } = useTimedChallengeStore();
  const [user] = useAuthState(auth);
  const [showGuestNotification, setShowGuestNotification] = useState(false);

  // Show guest notification if user is not authenticated and results exist
  useEffect(() => {
    if (results && !user) {
      setShowGuestNotification(true);
    }
  }, [results, user]);

  // Save timed challenge results to Firebase for authenticated users
  useEffect(() => {
    const saveResults = async () => {
      if (results && user) {
        try {
          console.log('🔄 Saving timed challenge results to database...');
          await updateUserTimedChallengeResults(user.uid, {
            challengeId: results.challengeId,
            score: results.score,
            grade: results.grade,
            correctAnswers: results.correctAnswers,
            totalQuestions: results.totalQuestions,
            timeSpent: results.timeSpent,
            accuracy: results.accuracy,
            completedAt: results.completedAt
          });
          console.log('✅ Timed challenge results saved to database');
        } catch (error) {
          console.error('❌ Error saving timed challenge results:', error);
        }
      }
    };

    saveResults();
  }, [results, user]);

  if (!results) {
    return <CustomLoader text="Loading results..." />;
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getGradeDescription = (grade: string): string => {
    switch (grade) {
      case 'S': return 'Outstanding! Perfect mastery!';
      case 'A': return 'Excellent! Great knowledge!';
      case 'B': return 'Good! Well done!';
      case 'C': return 'Fair! Keep studying!';
      case 'D': return 'Poor! More practice needed!';
      default: return 'Keep learning!';
    }
  };

  const getPerformanceMessage = (grade: string): string => {
    switch (grade) {
      case 'S': return 'You are a true Islamic scholar! 🌟';
      case 'A': return 'Mashallah! Excellent performance! 🎉';
      case 'B': return 'Good job! Keep up the great work! 👏';
      case 'C': return 'Not bad! There\'s room for improvement! 💪';
      case 'D': return 'Keep practicing! You\'ll get better! 📚';
      default: return 'Keep learning and improving! 🤲';
    }
  };

  return (
    <div className="challenge-results">
      <div className="results-header">
        <h1>🎯 Challenge Complete!</h1>
        <p className="results-subtitle">Here's how you performed</p>
      </div>

      <div className="grade-display">
        <div 
          className="grade-circle"
          style={{ 
            backgroundColor: getGradeColor(results.grade),
            boxShadow: `0 0 30px ${getGradeColor(results.grade)}40`
          }}
        >
          <span className="grade-letter">{results.grade}</span>
        </div>
        <div className="grade-info">
          <h2 className="grade-title">{getGradeDescription(results.grade)}</h2>
          <p className="performance-message">{getPerformanceMessage(results.grade)}</p>
        </div>
      </div>

      <div className="score-breakdown">
        <div className="breakdown-card">
          <h3>📊 Score Breakdown</h3>
          <div className="breakdown-grid">
            <div className="breakdown-item">
              <span className="breakdown-icon">🎯</span>
              <div className="breakdown-details">
                <span className="breakdown-label">Final Score</span>
                <span className="breakdown-value">{results.score} pts</span>
              </div>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-icon">✅</span>
              <div className="breakdown-details">
                <span className="breakdown-label">Correct Answers</span>
                <span className="breakdown-value">
                  {results.correctAnswers}/{results.totalQuestions}
                </span>
              </div>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-icon">📈</span>
              <div className="breakdown-details">
                <span className="breakdown-label">Accuracy</span>
                <span className="breakdown-value">{results.accuracy}%</span>
              </div>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-icon">⏱️</span>
              <div className="breakdown-details">
                <span className="breakdown-label">Time Used</span>
                <span className="breakdown-value">{formatTime(results.timeSpent)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grade-scale">
        <h3>🏆 Grade Scale</h3>
        <div className="scale-grid">
          <div className={`scale-item ${results.grade === 'S' ? 'achieved' : ''}`}>
            <span 
              className="scale-grade"
              style={{ color: getGradeColor('S') }}
            >
              S
            </span>
            <span className="scale-range">180+ pts</span>
            <span className="scale-desc">Outstanding</span>
          </div>
          <div className={`scale-item ${results.grade === 'A' ? 'achieved' : ''}`}>
            <span 
              className="scale-grade"
              style={{ color: getGradeColor('A') }}
            >
              A
            </span>
            <span className="scale-range">150-179 pts</span>
            <span className="scale-desc">Excellent</span>
          </div>
          <div className={`scale-item ${results.grade === 'B' ? 'achieved' : ''}`}>
            <span 
              className="scale-grade"
              style={{ color: getGradeColor('B') }}
            >
              B
            </span>
            <span className="scale-range">120-149 pts</span>
            <span className="scale-desc">Good</span>
          </div>
          <div className={`scale-item ${results.grade === 'C' ? 'achieved' : ''}`}>
            <span 
              className="scale-grade"
              style={{ color: getGradeColor('C') }}
            >
              C
            </span>
            <span className="scale-range">90-119 pts</span>
            <span className="scale-desc">Fair</span>
          </div>
          <div className={`scale-item ${results.grade === 'D' ? 'achieved' : ''}`}>
            <span 
              className="scale-grade"
              style={{ color: getGradeColor('D') }}
            >
              D
            </span>
            <span className="scale-range">0-89 pts</span>
            <span className="scale-desc">Poor</span>
          </div>
        </div>
      </div>

      <div className="results-actions">
        <button 
          className="action-btn primary"
          onClick={() => {
            if (onTryAnother) {
              onTryAnother();
            } else {
              resetChallenge();
            }
          }}
        >
          <span className="btn-icon">🔄</span>
          Try Another Challenge
        </button>
        <button 
          className="action-btn secondary"
          onClick={resetChallenge}
        >
          <span className="btn-icon">🏠</span>
          Back to Menu
        </button>
      </div>

      <div className="encouragement">
        <p>
          {results.grade >= 'B' ? 
            "Keep up the excellent work! Your Islamic knowledge is growing stronger! 🤲" :
            "Every challenge makes you stronger! Keep learning and practicing! 📚"
          }
        </p>
      </div>

      {/* Guest Score Notification */}
      {showGuestNotification && (
        <GuestScoreNotification
          isVisible={showGuestNotification}
          score={results.score}
          totalQuestions={results.totalQuestions}
          onClose={() => setShowGuestNotification(false)}
        />
      )}
    </div>
  );
};

export default ChallengeResults;
