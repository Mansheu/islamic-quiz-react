import React, { useEffect, useState } from 'react';
import { useQuizStore } from '../store';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import { updateUserQuizResults, ensureUserProfile } from '../firebase/auth';
import { updateUserProgress, updateDailyStreak } from '../firebase/achievements';
import { GuestScoreNotification } from './GuestScoreNotification';
import AchievementNotification from './AchievementNotification';
import CustomLoader from './CustomLoader';
import type { Achievement } from '../types/achievements';

const QuizComponent: React.FC = () => {
  const {
    getCurrentQuestion,
    currentQuestion,
    filteredQuestions,
    answeredQuestions,
    score,
    isQuizCompleted,
    selectedTopic,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    completeQuiz,
    getProgress,
    startRetryIncorrect,
    startNewQuizSameTopic,
    getIncorrectQuestionIndexes,
    resetQuiz,
    isPracticeMode,
  } = useQuizStore();

  const [user] = useAuthState(auth);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [showGuestNotification, setShowGuestNotification] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'correct'>('all');

  const question = getCurrentQuestion();
  const isAnswered = currentQuestion in answeredQuestions;
  const progress = getProgress();

  useEffect(() => {
    if (isAnswered) {
      setSelectedAnswer(answeredQuestions[currentQuestion].selected);
      setShowExplanation(true);
    } else {
      setSelectedAnswer('');
      setShowExplanation(false);
    }
  }, [currentQuestion, answeredQuestions, isAnswered]);

  const handleAnswerSelect = (answer: string) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answer);
    selectAnswer(currentQuestion, answer);
    setShowExplanation(true);
  };

  const handleNext = async () => {
    if (currentQuestion === filteredQuestions.length - 1) {
      // Complete the quiz first
      completeQuiz();
      
      // Save score to user profile if user is authenticated and not practice mode
      if (user && !isPracticeMode) {
        setIsSavingScore(true);
        try {
          console.log('💾 Saving quiz score:', {
            topic: selectedTopic,
            score: score,
            totalQuestions: filteredQuestions.length
          });
          
          // Ensure user profile exists before saving results
          await ensureUserProfile(user);
          await updateUserQuizResults(user.uid, selectedTopic, score);
          
          // Update achievements and daily streak
          const isPerfect = score === filteredQuestions.length;
          const newAchievements = await updateUserProgress(user.uid, {
            questionsAnswered: filteredQuestions.length,
            correctAnswers: score,
            isPerfectScore: isPerfect,
            quizTopic: selectedTopic,
            isTimedQuiz: false, // This could be enhanced to track timed quizzes
            isTimedPerfect: false
          });
          
          // Update daily streak
          await updateDailyStreak(user.uid);
          
          // Show achievement notifications for new unlocks
          if (newAchievements.length > 0) {
            setUnlockedAchievements(newAchievements);
          }
          
          console.log('✅ Score saved successfully!');
        } catch (error) {
          console.error('❌ Error saving score:', error);
        } finally {
          setIsSavingScore(false);
        }
      } else if (!user) {
        // Show guest notification if user is not authenticated
        setShowGuestNotification(true);
      }
    } else {
      nextQuestion();
    }
  };

  if (!question) {
    return (
      <div className="quiz-container">
        <div className="card">
          <h2>No questions available</h2>
          <p>Please start a quiz to see questions.</p>
        </div>
      </div>
    );
  }

  if (isQuizCompleted) {
    return (
      <div className="quiz-container">
        <div className="card">
          <h2>Quiz Completed!</h2>
          {isPracticeMode && (
            <div className="score-save-status" style={{ marginTop: '8px' }}>
              <p>Practice mode: results are not saved and achievements are not awarded.</p>
            </div>
          )}
          <div className="score-display">
            <p className="score-text">
              Your Score: <span className="score-number">{score}</span>/{filteredQuestions.length}
            </p>
            <p className="percentage">
              {Math.round((score / filteredQuestions.length) * 100)}%
            </p>
          </div>
          
          {user && !isPracticeMode && (
            <div className="score-save-status">
              {isSavingScore ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CustomLoader size="small" text="" />
                  <span>💾 Saving your score...</span>
                </div>
              ) : (
                <p>✅ Score saved to your profile!</p>
              )}
            </div>
          )}
          
          {/* Minimal controls: primary + overflow (hidden when all correct) */}
          {getIncorrectQuestionIndexes().length === 0 ? (
            <div className="nav-buttons" style={{ marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => resetQuiz()}>
                Back to Categories
              </button>
            </div>
          ) : (
            <div className="nav-buttons" style={{ marginTop: '16px' }}>
              <button
                className="btn btn-primary"
                onClick={() => startRetryIncorrect()}
              >
                Retry Incorrect
              </button>
              <button
                className="btn btn-secondary"
                style={{ marginLeft: 8 }}
                onClick={() => resetQuiz()}
              >
                Back to Categories
              </button>
            </div>
          )}

          {/* Review list with filter toggles */}
          <div style={{ marginTop: '24px' }}>
            <h3>Review</h3>
            <div style={{ margin: '8px 0 16px' }}>
              <label htmlFor="review-filter" style={{ marginRight: 8 }}>Filter:</label>
              <select
                id="review-filter"
                value={reviewFilter}
                onChange={(e) => setReviewFilter(e.target.value as 'all' | 'incorrect' | 'correct')}
                className="filter-select"
              >
                <option value="all">All ({filteredQuestions.length})</option>
                <option value="incorrect">Incorrect ({getIncorrectQuestionIndexes().length})</option>
                <option value="correct">Correct ({filteredQuestions.length - getIncorrectQuestionIndexes().length})</option>
              </select>
            </div>
            {filteredQuestions.map((q, idx) => {
              const ans = answeredQuestions[idx];
              const isCorrect = ans?.correct;
              if (reviewFilter === 'incorrect' && isCorrect) return null;
              if (reviewFilter === 'correct' && !isCorrect) return null;
              return (
                <div key={idx} className="card" style={{ padding: '16px', marginBottom: '12px' }}>
                  <div className="question" style={{ marginBottom: '8px' }}>
                    {idx + 1}. {q.question}
                  </div>
                  <div style={{ marginBottom: '6px' }}>
                    <strong>Your answer:</strong>{' '}
                    <span className={isCorrect ? 'option correct' : 'option incorrect'} style={{ display: 'inline-block', padding: '4px 8px' }}>
                      {ans?.selected}
                    </span>
                  </div>
                  {!isCorrect && (
                    <div style={{ marginBottom: '6px' }}>
                      <strong>Correct answer:</strong>{' '}
                      <span className="option correct" style={{ display: 'inline-block', padding: '4px 8px' }}>
                        {q.answer}
                      </span>
                    </div>
                  )}
                  {q.explanation && (
                    <div className="explanation" style={{ marginTop: '6px' }}>
                      <h4>Explanation:</h4>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="card">
        {/* Question Counter */}
        <div className="question-count">
          Question {currentQuestion + 1} of {filteredQuestions.length}
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div 
            className="progress-bar" 
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question */}
        <div className="question">
          {question.question}
        </div>

        {/* Options */}
        <div className="options">
          {question.options.map((option, index) => {
            let optionClass = 'option';
            
            if (selectedAnswer === option) {
              optionClass += isAnswered 
                ? (answeredQuestions[currentQuestion].correct ? ' correct' : ' incorrect')
                : ' selected';
            } else if (showExplanation && option === question.answer) {
              optionClass += ' correct';
            }

            return (
              <button
                key={index}
                className={optionClass}
                onClick={() => handleAnswerSelect(option)}
                disabled={isAnswered}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="explanation">
            <h4>Explanation:</h4>
            <p>{question.explanation}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="nav-buttons">
          <button
            className="btn btn-secondary"
            onClick={previousQuestion}
            disabled={currentQuestion === 0}
          >
            Previous
          </button>
          
          {isAnswered && (
            <button
              className="btn btn-primary"
              onClick={handleNext}
            >
              {currentQuestion === filteredQuestions.length - 1 ? 'Complete Quiz' : 'Next'}
            </button>
          )}
        </div>
      </div>
      
      {/* Guest Score Notification */}
      {showGuestNotification && (
        <GuestScoreNotification
          isVisible={showGuestNotification}
          score={score}
          totalQuestions={filteredQuestions.length}
          onClose={() => setShowGuestNotification(false)}
        />
      )}
      
      {/* Achievement Notifications */}
      {unlockedAchievements.map((achievement, index) => (
        <AchievementNotification
          key={`${achievement.id}-${Date.now()}-${index}`}
          achievement={achievement}
          onClose={() => {
            setUnlockedAchievements(prev => 
              prev.filter((_, i) => i !== index)
            );
          }}
        />
      ))}
    </div>
  );
};

export default QuizComponent;
