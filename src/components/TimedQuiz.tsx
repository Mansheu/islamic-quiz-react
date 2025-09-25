import React, { useEffect } from 'react';
import { useTimedChallengeStore } from '../store/timedChallenge';
import CustomLoader from './CustomLoader';
import './TimedQuiz.css';

export const TimedQuiz: React.FC = () => {
  const {
    currentChallenge,
    questions,
    currentQuestionIndex,
    timeRemaining,
    streak,
    answerQuestion,
    updateTimer,
    endChallenge
  } = useTimedChallengeStore();

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      updateTimer();
    }, 1000);

    return () => clearInterval(timer);
  }, [updateTimer]);

  if (!currentChallenge || questions.length === 0) {
    return <CustomLoader text="Loading challenge..." />;
  }

  // Check if quiz is completed
  if (currentQuestionIndex >= questions.length) {
    endChallenge();
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / questions.length) * 100;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (): string => {
    const percentage = timeRemaining / currentChallenge.timeLimit;
    if (percentage > 0.5) return '#4CAF50'; // Green
    if (percentage > 0.25) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const handleAnswerClick = (answerIndex: number) => {
    answerQuestion(answerIndex);
  };

  return (
    <div className="timed-quiz">
      <div className="quiz-header">
        <div className="challenge-info">
          <h2 className="challenge-title">
            {currentChallenge.icon} {currentChallenge.name}
          </h2>
          <div className="challenge-meta">
            <span className="multiplier-badge">
              {currentChallenge.scoreMultiplier}x multiplier
            </span>
          </div>
        </div>

        <div className="timer-section">
          <div 
            className="timer-display"
            style={{ color: getTimeColor() }}
          >
            <span className="timer-icon">⏰</span>
            <span className="timer-text">{formatTime(timeRemaining)}</span>
          </div>
          {streak > 1 && (
            <div className="streak-display">
              <span className="streak-icon">🔥</span>
              <span className="streak-text">{streak} streak!</span>
            </div>
          )}
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-info">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="question-section">
        <div className="question-card">
          <h3 className="question-text">{currentQuestion.question}</h3>
          
          <div className="options-grid">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className="option-btn"
                onClick={() => handleAnswerClick(index)}
              >
                <span className="option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="quiz-footer">
        <div className="quiz-stats">
          <div className="stat-item">
            <span className="stat-icon">🎯</span>
            <span className="stat-label">Accuracy</span>
            <span className="stat-value">
              {currentQuestionIndex > 0 ? '...' : '100'}%
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🔥</span>
            <span className="stat-label">Streak</span>
            <span className="stat-value">{streak}</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">✨</span>
            <span className="stat-label">Multiplier</span>
            <span className="stat-value">{currentChallenge.scoreMultiplier}x</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimedQuiz;
