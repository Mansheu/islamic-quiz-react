import React, { useState } from 'react';
import { sendPasswordReset } from '../firebase/auth';

interface PasswordResetProps {
  onClose: () => void;
  defaultEmail?: string;
}

const PasswordReset: React.FC<PasswordResetProps> = ({ onClose, defaultEmail = '' }) => {
  const [email, setEmail] = useState(defaultEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      await sendPasswordReset(email);
      setIsSuccess(true);
      setMessage(`Password reset email sent to ${email}. Check your inbox and follow the instructions to reset your password.`);
    } catch (error: unknown) {
      setIsSuccess(false);
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/user-not-found') {
        setMessage('No account found with this email address.');
      } else if (firebaseError.code === 'auth/invalid-email') {
        setMessage('Please enter a valid email address.');
      } else {
        setMessage('Failed to send password reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="password-reset-overlay">
      <div className="password-reset-modal">
        <div className="password-reset-header">
          <h2>Reset Password</h2>
          <button
            type="button"
            onClick={onClose}
            className="close-btn"
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="password-reset-content">
          {!isSuccess ? (
            <>
              <p className="reset-description">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="reset-form">
                <div className="form-group">
                  <label htmlFor="reset-email">Email Address</label>
                  <input
                    type="email"
                    id="reset-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={isLoading}
                    required
                    className="form-input"
                  />
                </div>

                {message && (
                  <div className={`message ${isSuccess ? 'success' : 'error'}`}>
                    {message}
                  </div>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-secondary"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Email'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="success-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <p className="success-message">{message}</p>
              <button
                onClick={onClose}
                className="btn btn-primary"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;