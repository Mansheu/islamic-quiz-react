import React, { useEffect, useState } from 'react';
import { useQuizStore } from '../store';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import { updateUserQuizResults, ensureUserProfile } from '../firebase/auth';
import { updateUserProgress, updateDailyStreak } from '../firebase/achievements';
import { GuestScoreNotification } from './GuestScoreNotification';
import AchievementNotification from './AchievementNotification';
import BookmarkButton from './BookmarkButton';
import ReportButton from './ReportButton';
import CustomLoader from './CustomLoader';
import type { Achievement } from '../types/achievements';
import { useNotifications } from '../hooks/useNotifications';
import './QuizComponent.css';

type ReportType = 'incorrect' | 'unclear' | 'typo' | 'other';

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
  const { showSuccess, showError, showInfo } = useNotifications();

  // Bookmark/report state
  const [bookmarkedKeys, setBookmarkedKeys] = useState<Set<string>>(new Set());
  const [loadingBookmarks, setLoadingBookmarks] = useState<boolean>(false);
  const [reportOpen, setReportOpen] = useState<boolean>(false);
  const [reportType, setReportType] = useState<ReportType>('incorrect');
  const [reportMessage, setReportMessage] = useState<string>('');

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

  // Load user's bookmark keys once
  useEffect(() => {
    const load = async () => {
      if (!user) { setBookmarkedKeys(new Set()); return; }
      setLoadingBookmarks(true);
      try {
        const mod = await import('../firebase/bookmarks');
        const docs = await mod.getBookmarks(user.uid);
        setBookmarkedKeys(new Set(docs.map(d => d.key)));
      } catch (e) {
        console.error('Failed to load bookmarks', e);
      } finally {
        setLoadingBookmarks(false);
      }
    };
    load();
  }, [user]);

  // Debug logging for "All Topics" quiz issues
  React.useEffect(() => {
    if (selectedTopic === 'All Topics' && question) {
      console.log('All Topics Quiz - Question data:', {
        hasQuestion: !!question,
        hasQuestionText: !!question.question,
        hasAnswer: !!question.answer,
        hasTopic: !!question.topic,
        hasOptions: !!question.options,
        questionData: question
      });
    }
  }, [question, selectedTopic]);

  const currentKey = question && question.question && question.answer 
    ? `${question.question}__${question.answer}`.toLowerCase() 
    : '';
  const isBookmarked = question && currentKey ? bookmarkedKeys.has(currentKey) : false;

  const toggleBookmark = async () => {
    if (!user) {
      showInfo('🔐 Sign in to bookmark questions and build your personal review collection');
      return;
    }
    
    if (!question || !question.question || !question.answer) {
      console.error('Invalid question data for bookmark:', question);
      showError('❌ Cannot bookmark this question. Question data is incomplete.');
      return;
    }

    try {
      const bm = await import('../firebase/bookmarks');
      if (isBookmarked) {
        await bm.removeBookmark(user.uid, question);
        setBookmarkedKeys(prev => { const s = new Set(prev); s.delete(currentKey); return s; });
        showSuccess('📖 Removed from bookmarks');
      } else {
        await bm.addBookmark(user.uid, question);
        setBookmarkedKeys(prev => new Set(prev).add(currentKey));
        showSuccess('⭐ Saved to bookmarks! Review later from the Bookmarks tab.');
      }
    } catch (e) {
      console.error('Bookmark toggle failed', e);
      showError('❌ Could not update bookmark. Please try again.');
    }
  };

  const submitReport = async () => {
    if (!user) {
      showInfo('🔐 Sign in to report questions and help improve our content');
      return;
    }
    
    if (!question || !question.question || !question.answer) {
      console.error('Invalid question data for report:', question);
      showError('❌ Cannot report this question. Question data is incomplete.');
      return;
    }
    
    // Description is completely optional - allow empty or any length
    const trimmedMessage = reportMessage.trim();
    console.log('Submitting report with message:', trimmedMessage || '(empty)');
    
    try {
      const { submitQuestionReport } = await import('../firebase/reports');
      await submitQuestionReport(user.uid, question, reportType, trimmedMessage || undefined);
      setReportOpen(false);
      setReportMessage('');
      setReportType('incorrect');
      showSuccess('🚩 Report submitted successfully! Our team will review it shortly.');
    } catch (e) {
      console.error('Report failed with error:', e);
      showError('❌ Could not submit report. Please try again.');
    }
  };

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

        {/* Quick actions */}
        <div className="quiz-actions">
          <BookmarkButton
            isBookmarked={isBookmarked}
            onToggle={toggleBookmark}
            disabled={loadingBookmarks || !question || !question.question || !question.answer}
            size="medium"
          />
          <ReportButton
            onReport={() => setReportOpen(true)}
            disabled={!question || !question.question || !question.answer}
            size="medium"
          />
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

      {/* Report Modal */}
      {reportOpen && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="card" style={{ maxWidth: 520, width: '90%' }}>
            <h3>Report Question</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{question.question}</p>
            <div style={{ marginTop: 8 }}>
              <label htmlFor="rtype">Reason</label>
              <select id="rtype" value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)} style={{ width: '100%', marginTop: 6 }}>
                <option value="incorrect">Incorrect answer/content</option>
                <option value="unclear">Unclear wording</option>
                <option value="typo">Spelling/typo</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={{ marginTop: 8 }}>
              <label htmlFor="rmsg">Details (optional)</label>
              <textarea id="rmsg" value={reportMessage} onChange={(e) => setReportMessage(e.target.value)} rows={4} style={{ width: '100%', marginTop: 6 }} placeholder="Describe the issue briefly..." />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setReportOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitReport}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizComponent;
