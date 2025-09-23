import React, { useEffect, useState } from 'react';
import './GuestScoreNotification.css';

interface GuestScoreNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  score: number;
  totalQuestions: number;
}

export const GuestScoreNotification: React.FC<GuestScoreNotificationProps> = ({ 
  isVisible, 
  onClose, 
  score, 
  totalQuestions 
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      // Auto-close after 8 seconds
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300); // Wait for animation
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`guest-score-notification ${show ? 'show' : ''}`}>
      <div className="notification-content">
        <div className="notification-header">
          <div className="notification-icon">👤</div>
          <h3>Guest Mode - Score Not Saved</h3>
          <button className="close-btn" onClick={() => setShow(false)}>
            ×
          </button>
        </div>
        
        <div className="notification-body">
          <div className="score-display">
            <div className="score-circle">
              <span className="score-number">{score}</span>
              <span className="score-total">/ {totalQuestions}</span>
            </div>
          </div>
          
          <div className="notification-message">
            <p className="main-message">
              <strong>Your quiz is complete!</strong>
            </p>
            <p className="sub-message">
              Since you're playing as a guest, your score of <strong>{score}/{totalQuestions}</strong> won't be saved to leaderboards or your profile.
            </p>
            <div className="cta-section">
              <p className="cta-message">
                <strong>Want to track your progress?</strong> Sign up to save scores, compete on leaderboards, and unlock all features!
              </p>
              <div className="cta-buttons">
                <button className="btn-primary">🔑 Sign Up Now</button>
                <button className="btn-secondary" onClick={() => setShow(false)}>Continue as Guest</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};