import React, { useState } from 'react';
import InlineNotification from './InlineNotification';
import './InlineNotificationDemo.css';

const InlineNotificationDemo: React.FC = () => {
  const [notifications, setNotifications] = useState<{
    success: { visible: boolean; message: string };
    error: { visible: boolean; message: string };
  }>({
    success: { visible: false, message: '' },
    error: { visible: false, message: '' }
  });

  const showSuccessNotification = () => {
    setNotifications(prev => ({
      ...prev,
      success: { 
        visible: true, 
        message: '✅ Success! Your action was completed successfully. This notification demonstrates auto-hide functionality.' 
      }
    }));
  };

  const showErrorNotification = () => {
    setNotifications(prev => ({
      ...prev,
      error: { 
        visible: true, 
        message: '❌ Error! Something went wrong. Please check your input and try again. This is a longer error message to demonstrate text wrapping.' 
      }
    }));
  };

  const hideSuccessNotification = () => {
    setNotifications(prev => ({
      ...prev,
      success: { ...prev.success, visible: false }
    }));
  };

  const hideErrorNotification = () => {
    setNotifications(prev => ({
      ...prev,
      error: { ...prev.error, visible: false }
    }));
  };

  return (
    <div className="inline-notification-demo">
      <div className="demo-header">
        <h2>🔔 Inline Notification System Demo</h2>
        <p>
          This demo showcases the new inline notification system that replaces toast notifications 
          with contextual, accessible notifications that support light and dark themes.
        </p>
      </div>

      <div className="demo-controls">
        <h3>Try the notifications:</h3>
        <div className="button-group">
          <button 
            className="demo-btn demo-btn--success" 
            onClick={showSuccessNotification}
          >
            Show Success Notification
          </button>
          <button 
            className="demo-btn demo-btn--error" 
            onClick={showErrorNotification}
          >
            Show Error Notification
          </button>
        </div>
      </div>

      <div className="demo-notifications">
        <h3>Notification Examples:</h3>
        
        {/* Success Notification */}
        <div className="notification-example">
          <h4>Success Notification:</h4>
          <InlineNotification
            type="success"
            message={notifications.success.message}
            isVisible={notifications.success.visible}
            onDismiss={hideSuccessNotification}
            autoClose={true}
            autoCloseDelay={5000}
            showIcon={true}
            showCloseButton={true}
          />
        </div>

        {/* Error Notification */}
        <div className="notification-example">
          <h4>Error Notification:</h4>
          <InlineNotification
            type="error"
            message={notifications.error.message}
            isVisible={notifications.error.visible}
            onDismiss={hideErrorNotification}
            autoClose={false}
            showIcon={true}
            showCloseButton={true}
          >
            <div className="notification-actions">
              <button className="action-btn action-btn--secondary">
                Learn More
              </button>
              <button className="action-btn action-btn--primary">
                Try Again
              </button>
            </div>
          </InlineNotification>
        </div>

        {/* Static Examples */}
        <div className="notification-example">
          <h4>Compact Success (always visible):</h4>
          <InlineNotification
            type="success"
            message="Bookmark added successfully"
            isVisible={true}
            onDismiss={() => {}}
            showIcon={true}
            showCloseButton={false}
            className="inline-notification--compact"
          />
        </div>

        <div className="notification-example">
          <h4>Compact Error (always visible):</h4>
          <InlineNotification
            type="error"
            message="Failed to save changes"
            isVisible={true}
            onDismiss={() => {}}
            showIcon={true}
            showCloseButton={false}
            className="inline-notification--compact"
          />
        </div>
      </div>

      <div className="demo-features">
        <h3>🌟 Key Features:</h3>
        <ul>
          <li>✨ <strong>Auto-dismiss:</strong> Notifications can automatically hide after a specified delay</li>
          <li>🎨 <strong>Light/Dark Mode:</strong> Automatic theme support with CSS custom properties</li>
          <li>♿ <strong>Accessibility:</strong> ARIA labels, keyboard navigation, and screen reader support</li>
          <li>📱 <strong>Responsive:</strong> Optimized for mobile with proper touch targets</li>
          <li>🎭 <strong>Animations:</strong> Smooth slide-in/out animations with reduced motion support</li>
          <li>🔧 <strong>Customizable:</strong> Compact variant, custom content, and flexible styling</li>
          <li>🎯 <strong>Contextual:</strong> Inline positioning keeps notifications close to related content</li>
        </ul>
      </div>

      <div className="demo-usage">
        <h3>💡 Usage Examples:</h3>
        <div className="usage-grid">
          <div className="usage-card">
            <h4>Form Validation</h4>
            <p>Show field-specific errors inline with form inputs</p>
          </div>
          <div className="usage-card">
            <h4>Action Feedback</h4>
            <p>Confirm successful operations like saves, deletions, updates</p>
          </div>
          <div className="usage-card">
            <h4>Loading States</h4>
            <p>Display progress and status during async operations</p>
          </div>
          <div className="usage-card">
            <h4>User Guidance</h4>
            <p>Provide contextual help and tips within workflows</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InlineNotificationDemo;