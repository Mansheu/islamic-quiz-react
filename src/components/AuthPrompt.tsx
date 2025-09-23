import React from 'react';
import './AuthPrompt.css';

interface AuthPromptProps {
  onSignIn: () => void;
  onContinueAsGuest: () => void;
  onCancel: () => void;
  quizType: 'regular' | 'timed';
}

export const AuthPrompt: React.FC<AuthPromptProps> = ({ 
  onSignIn, 
  onContinueAsGuest, 
  onCancel, 
  quizType 
}) => {
  return (
    <div className="auth-prompt-overlay">
      <div className="auth-prompt-modal">
        <div className="auth-prompt-header">
          <h3>🔐 Authentication Required</h3>
        </div>
        
        <div className="auth-prompt-content">
          <div className="auth-prompt-icon">
            {quizType === 'timed' ? '⚡' : '🎯'}
          </div>
          
          <h4>
            {quizType === 'timed' 
              ? 'Sign In Required for Timed Challenges!' 
              : 'Ready to start your Quiz?'
            }
          </h4>
          
          <p>
            {quizType === 'timed' 
              ? 'Timed challenges require an account to save scores and compete on leaderboards.'
              : 'Choose how you\'d like to continue:'
            }
          </p>
          
          <div className="auth-options">
            <div className="auth-option recommended">
              <div className="option-icon">✅</div>
              <div className="option-content">
                <h5>Sign In / Sign Up</h5>
                <p>Save your scores, track progress, compete on leaderboards, and access all features!</p>
              </div>
            </div>
            
            {quizType === 'regular' && (
              <div className="auth-option">
                <div className="option-icon">👤</div>
                <div className="option-content">
                  <h5>Continue as Guest</h5>
                  <p>Play without saving scores. Your progress won't be saved to leaderboards.</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="auth-prompt-actions">
            <button className="btn btn-primary" onClick={onSignIn}>
              🔑 Sign In / Sign Up
            </button>
            {quizType === 'regular' && (
              <button className="btn btn-secondary" onClick={onContinueAsGuest}>
                👤 Continue as Guest
              </button>
            )}
            <button className="btn btn-outline" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};