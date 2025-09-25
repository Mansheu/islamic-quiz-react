import React, { useState } from 'react';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '../firebase/auth';
import { getSuccessMessage } from '../utils/errorMessages';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const showInlineNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    // Auto-clear after 5 seconds
    setTimeout(() => setNotification(null), 5000);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
        showInlineNotification(getSuccessMessage('sign-in'), 'success');
      } else {
        // Validate passwords match for sign up
        if (password !== confirmPassword) {
          showInlineNotification('Passwords do not match', 'error');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          showInlineNotification('Password must be at least 6 characters long', 'error');
          setLoading(false);
          return;
        }
        await signUpWithEmail(email, password, displayName);
        showInlineNotification(getSuccessMessage('sign-up'), 'success');
      }
      // Close modal after 1.5 seconds to show success message
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);
    } catch (error) {
      showInlineNotification(error instanceof Error ? error.message : 'An unexpected error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setNotification(null);
    setLoading(true);

    try {
      await signInWithGoogle();
      showInlineNotification(getSuccessMessage('sign-in'), 'success');
      // Close modal after 1.5 seconds to show success message
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);
    } catch (error) {
      showInlineNotification(error instanceof Error ? error.message : 'Google sign-in failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setNotification(null);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setNotification(null);
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2>{isLogin ? 'Sign In' : 'Sign Up'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="Enter your display name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                minLength={6}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {showPassword ? (
                    // Eye with slash (hide)
                    <>
                      <path d="m15 18-.722-3.25"/>
                      <path d="M2 8a10.645 10.645 0 0 0 20 0"/>
                      <path d="m20 15-1.726-2.05"/>
                      <path d="m4 15 1.726-2.05"/>
                      <path d="m9 18 .722-3.25"/>
                      <circle cx="12" cy="13" r="3"/>
                    </>
                  ) : (
                    // Regular eye (show)
                    <>
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {showConfirmPassword ? (
                      // Eye with slash (hide)
                      <>
                        <path d="m15 18-.722-3.25"/>
                        <path d="M2 8a10.645 10.645 0 0 0 20 0"/>
                        <path d="m20 15-1.726-2.05"/>
                        <path d="m4 15 1.726-2.05"/>
                        <path d="m9 18 .722-3.25"/>
                        <circle cx="12" cy="13" r="3"/>
                      </>
                    ) : (
                      // Regular eye (show)
                      <>
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>
          )}

          {notification && (
            <div className={`inline-notification ${notification.type}`}>
              <div className="notification-icon">
                {notification.type === 'success' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22,4 12,14.01 9,11.01"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                )}
              </div>
              <span className="notification-message">{notification.message}</span>
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button 
          onClick={handleGoogleSignIn} 
          className="google-signin-btn"
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-switch">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button type="button" onClick={toggleMode} className="switch-button">
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};
