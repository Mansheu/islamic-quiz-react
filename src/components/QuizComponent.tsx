import React, { useEffect, useState } from 'react';
import { useQuizStore } from '../store';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import { updateUserQuizResults, ensureUserProfile } from '../firebase/auth';
import { GuestScoreNotification } from './GuestScoreNotification';

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
  } = useQuizStore();

  const [user] = useAuthState(auth);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [showGuestNotification, setShowGuestNotification] = useState(false);

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
      
      // Save score to user profile if user is authenticated
      if (user) {
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
          console.log('✅ Score saved successfully!');
        } catch (error) {
          console.error('❌ Error saving score:', error);
        } finally {
          setIsSavingScore(false);
        }
      } else {
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
          <div className="score-display">
            <p className="score-text">
              Your Score: <span className="score-number">{score}</span>/{filteredQuestions.length}
            </p>
            <p className="percentage">
              {Math.round((score / filteredQuestions.length) * 100)}%
            </p>
          </div>
          
          {user && (
            <div className="score-save-status">
              {isSavingScore ? (
                <p>💾 Saving your score...</p>
              ) : (
                <p>✅ Score saved to your profile!</p>
              )}
            </div>
          )}
          
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Start New Quiz
          </button>
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
    </div>
  );
};

export default QuizComponent;