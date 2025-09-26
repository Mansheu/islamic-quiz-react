import { useState, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase/config';

import { isAdmin } from './firebase/admin';
import { useQuizStore } from './store';
import { useTimedChallengeStore } from './store/timedChallenge';
import QuizSetup from './components/QuizSetup';
import QuizComponent from './components/QuizComponent';
import { TimedChallengeSelector } from './components/TimedChallengeSelector';
import { TimedQuiz } from './components/TimedQuiz';
import { ChallengeResults } from './components/ChallengeResults';
import { TimedLeaderboard } from './components/TimedLeaderboard';
import Leaderboard from './components/Leaderboard';
import AdminDashboard from './components/AdminDashboard';
import AchievementDashboard from './components/AchievementDashboard';
import ThemeToggle from './components/ThemeToggle';
import { AuthModal } from './components/AuthModal';
import { UserProfile } from './components/UserProfile';
import { AuthPrompt } from './components/AuthPrompt';
import IntroOverlay from './components/IntroOverlay';
import NotificationToast from './components/NotificationToast';
import ScrollToTop from './components/ScrollToTop';
import CustomLoader from './components/CustomLoader';
import AutoTimedChallengeSync from './components/AutoTimedChallengeSync';
import './App.css';

type AppView = 'quiz' | 'timed-challenge' | 'leaderboard' | 'admin' | 'achievements';

function App() {
  const { isQuizStarted, resetQuiz } = useQuizStore();
  const { isActive: isChallengeActive, results: challengeResults, resetChallenge } = useTimedChallengeStore();
  const [user, loading, error] = useAuthState(auth);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('quiz');
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authPromptType, setAuthPromptType] = useState<'regular' | 'timed'>('regular');
  const [isGuestMode, setIsGuestMode] = useState(false);
  const navigationRef = useRef<HTMLDivElement>(null);
  // Always show intro on page load/reload
  const [showIntro, setShowIntro] = useState<boolean>(true);
  // No localStorage check needed - intro shows every time

  // Handle horizontal scroll for navigation tabs
  const scrollNavigation = (direction: 'left' | 'right') => {
    if (navigationRef.current) {
      const scrollAmount = 200; // Adjust scroll distance as needed
      const currentScroll = navigationRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      navigationRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  // Handle quiz start attempts
  const handleQuizStart = (type: 'regular' | 'timed') => {
    // Always show auth prompt for non-authenticated users
    if (!user) {
      setAuthPromptType(type);
      setShowAuthPrompt(true);
      return;
    }
    
    // Proceed with quiz for authenticated users
    if (type === 'regular') {
      setCurrentView('quiz');
    } else {
      setCurrentView('timed-challenge');
    }
  };

  // Handle auth prompt responses
  const handleAuthPromptSignIn = () => {
    setShowAuthPrompt(false);
    setShowAuthModal(true);
  };

  const handleAuthPromptGuest = () => {
    setShowAuthPrompt(false);
    setIsGuestMode(true);
    
    // Clear any existing user data for guest mode
    const { resetChallenge } = useTimedChallengeStore.getState();
    resetChallenge(); // This will clear personalBests and results
    
    // Guest users can only access regular quiz
    setCurrentView('quiz');
  };

  const handleAuthPromptCancel = () => {
    setShowAuthPrompt(false);
  };

  // Handle view changes with auth checks
  const handleViewChange = (view: AppView) => {
    // Timed challenges are only available to authenticated users
    if (view === 'timed-challenge' && !user) {
      // Redirect to regular quiz or show sign-in required message
      return;
    }
    
    if (view === 'quiz' && !user) {
      handleQuizStart('regular');
      return;
    }
    
    setCurrentView(view);
  };

  if (loading) {
    return (
      <div className="App">
        <div className="container">
          <CustomLoader text="Initializing app..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <div className="container">
          <div className="error-message">Authentication error: {error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="container">
        <header>
          <div className="header-left">
            <ThemeToggle />
          </div>
          <div className="header-center">
            <div className="app-title">
              <h1>Dawah Quiz Hub</h1>
              <p className="community-subtitle">by Mansheu Dawah</p>
            </div>
          </div>
          <div className="header-right">
            {user ? (
              <div className="user-menu">
                <button 
                  className="user-profile-btn"
                  onClick={() => setShowProfile(true)}
                  title={user.displayName || user.email?.split('@')[0] || 'User'}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="user-avatar" />
                  ) : (
                    <div className="user-avatar">
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
              </div>
            ) : (
              <button 
                className="auth-btn"
                onClick={() => setShowAuthModal(true)}
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Navigation Tabs */}
        {!isQuizStarted && !isChallengeActive && !challengeResults && (
          <div className="navigation-container">
            <button 
              className="scroll-btn scroll-left"
              onClick={() => scrollNavigation('left')}
              aria-label="Scroll left"
            >
              ‹
            </button>
            
            <div className="navigation-tabs" ref={navigationRef}>
              <button 
                className={`nav-tab ${currentView === 'quiz' ? 'active' : ''}`}
                onClick={() => handleViewChange('quiz')}
              >
                🎯 Quiz
              </button>
              {/* Only show timed challenge if user is signed in */}
              {user && (
                <button 
                  className={`nav-tab ${currentView === 'timed-challenge' ? 'active' : ''}`}
                  onClick={() => handleViewChange('timed-challenge')}
                >
                  ⚡ Challenge
                </button>
              )}
              <button 
                className={`nav-tab ${currentView === 'leaderboard' ? 'active' : ''}`}
                onClick={() => handleViewChange('leaderboard')}
              >
                🏆 Leaderboard
              </button>
              <button 
                className={`nav-tab ${currentView === 'achievements' ? 'active' : ''}`}
                onClick={() => handleViewChange('achievements')}
              >
                🎖️ Achievements
              </button>
              {user && isAdmin(user.email) && (
                <button 
                  className={`nav-tab ${currentView === 'admin' ? 'active' : ''}`}
                  onClick={() => handleViewChange('admin')}
                >
                  🛠️ Admin
                </button>
              )}
            </div>
            
            <button 
              className="scroll-btn scroll-right"
              onClick={() => scrollNavigation('right')}
              aria-label="Scroll right"
            >
              ›
            </button>
          </div>
        )}

        {/* Main Content */}
        {isQuizStarted ? (
          <div>
            <QuizComponent />
            <div className="bottom-controls">
              <button 
                className="btn btn-danger"
                onClick={() => {
                  resetQuiz();
                  setCurrentView('quiz');
                }}
              >
                Quit Quiz
              </button>
            </div>
          </div>
        ) : isChallengeActive ? (
          <div>
            <TimedQuiz />
            <div className="bottom-controls">
              <button 
                className="btn btn-danger"
                onClick={() => {
                  resetChallenge();
                  setCurrentView('timed-challenge');
                }}
              >
                Quit Challenge
              </button>
            </div>
          </div>
        ) : challengeResults ? (
          <ChallengeResults />
        ) : currentView === 'quiz' ? (
          <QuizSetup isGuestMode={isGuestMode} />
        ) : currentView === 'timed-challenge' && user ? (
          <TimedChallengeSelector isGuestMode={false} />
        ) : currentView === 'leaderboard' ? (
          <div>
            <Leaderboard />
            {/* Only show timed leaderboard if user is signed in */}
            {user && (
              <div style={{ marginTop: '40px' }}>
                <TimedLeaderboard />
              </div>
            )}
          </div>
        ) : currentView === 'achievements' ? (
          <AchievementDashboard />
        ) : (
          <AdminDashboard />
        )}

        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => {
            setShowAuthModal(false);
            // Reset guest mode if user successfully signs in
            if (user) {
              setIsGuestMode(false);
            }
          }} 
        />
        
        {showAuthPrompt && (
          <AuthPrompt
            onSignIn={handleAuthPromptSignIn}
            onContinueAsGuest={handleAuthPromptGuest}
            onCancel={handleAuthPromptCancel}
            quizType={authPromptType}
          />
        )}
        
        <UserProfile 
          isOpen={showProfile} 
          onClose={() => setShowProfile(false)} 
        />

        <NotificationToast />
        <ScrollToTop />

        <div className="sticky-badge">
          🤍ྀི Made by <strong>
            <a 
              href="https://github.com/Mansheu" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Mansheu
            </a>
          </strong>
        </div>

        <footer className="footer">
          Made with <span className="heart">💗</span> by <strong>
            <a 
              href="https://github.com/Mansheu" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Mansheu
            </a>
          </strong>
        </footer>
      </div>
      {showIntro && (
        <IntroOverlay
          onStart={() => {
            // Simply hide the intro when Go button is clicked
            setShowIntro(false);
          }}
        />
      )}
      
      {/* Automatic sync component - triggers when user signs in */}
      <AutoTimedChallengeSync />
    </div>
  );
}

export default App;

