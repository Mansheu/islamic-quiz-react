import React, { useEffect, useState, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import { 
  logOut, 
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  changeUserPassword
} from '../firebase/auth';
import { testStorageConnection, testImageUpload } from '../firebase/storage-test';
import PasswordInput from './PasswordInput';
import './UserProfile.css';

interface UserProfileData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  location?: string;
  totalScore: number;
  highScores: Record<string, number>;
  joinedAt: Date;
  lastPlayed: Date;
}

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const [user, loading, error] = useAuthState(auth);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Edit form state
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const fetchUserProfile = useCallback(async () => {
    if (!user) return;
    
    setProfileLoading(true);
    try {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setProfileData(profile);
        setDisplayName(profile.displayName);
        setLocation(profile.location || '');
        setPreviewUrl(profile.photoURL || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && isOpen) {
      fetchUserProfile();
    }
  }, [user, isOpen, fetchUserProfile]);

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleTestStorage = async () => {
    console.log('Testing Firebase Storage connection...');
    
    try {
      // Test basic storage connection
      await testStorageConnection();
      console.log('✅ Storage connection test passed');
      
      // Test image upload with a small test image
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 100, 100);
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            const testFile = new File([blob], 'test.png', { type: 'image/png' });
            await testImageUpload(testFile);
            console.log('✅ Image upload test completed');
          }
        });
      }
    } catch (error) {
      console.error('❌ Storage test failed:', error);
      showMessage(`Storage test failed: ${error}`, 'error');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showMessage('Image must be smaller than 5MB', 'error');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        showMessage('Please select an image file', 'error');
        return;
      }

      setProfilePicture(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setIsSaving(true);
    setMessage('');

    try {
      let photoURL = profileData?.photoURL;

      // Upload new profile picture if selected
      if (profilePicture) {
        setUploadingImage(true);
        photoURL = await uploadProfilePicture(user, profilePicture);
      }

      // Update profile
      await updateUserProfile(user, {
        displayName: displayName.trim(),
        location: location.trim(),
        ...(photoURL && { photoURL })
      });

      // Change password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }
        await changeUserPassword(user, newPassword);
      }

      // Reload profile
      await fetchUserProfile();

      setIsEditing(false);
      setNewPassword('');
      setConfirmPassword('');
      setProfilePicture(null);
      showMessage('Profile updated successfully!', 'success');
    } catch (error: unknown) {
      let errorMessage = 'Failed to update profile';
      
      if (error instanceof Error) {
        if (error.message.includes('auth/invalid-profile-attribute')) {
          errorMessage = 'Image too large. Please try a smaller image or the system will compress it automatically.';
          
          // If it's a photoURL error, try uploading again with compression
          if (profilePicture && error.message.includes('Photo URL too long')) {
            try {
              console.log('🔄 Retrying with image compression...');
              const compressedURL = await uploadProfilePicture(user, profilePicture, true);
              
              await updateUserProfile(user, {
                displayName: displayName.trim(),
                location: location.trim(),
                photoURL: compressedURL
              });
              
              await fetchUserProfile();
              setIsEditing(false);
              setNewPassword('');
              setConfirmPassword('');
              setProfilePicture(null);
              showMessage('Profile updated successfully with compressed image!', 'success');
              return;
            } catch (retryError) {
              console.error('❌ Retry failed:', retryError);
              errorMessage = 'Image too large even after compression. Please use a smaller image.';
            }
          }
        } else {
          errorMessage = error.message;
        }
      }
      
      showMessage(errorMessage, 'error');
    } finally {
      setIsSaving(false);
      setUploadingImage(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setDisplayName(profileData?.displayName || '');
    setLocation(profileData?.location || '');
    setNewPassword('');
    setConfirmPassword('');
    setProfilePicture(null);
    setPreviewUrl(profileData?.photoURL || '');
    setMessage('');
  };

  if (!isOpen) return null;

  if (loading || profileLoading) {
    return (
      <div className="profile-modal-overlay" onClick={onClose}>
        <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-modal-overlay" onClick={onClose}>
        <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
          <div className="error-message">Error loading user data: {error.message}</div>
          <button onClick={onClose} className="close-btn">Close</button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const topicScores = profileData?.highScores || {};
  const totalScore = profileData?.totalScore || 0;

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-header">
          <h2>Profile</h2>
          <div className="header-actions">
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="edit-profile-btn">
                Edit Profile
              </button>
            )}
            <button className="close-button" onClick={onClose}>×</button>
          </div>
        </div>

        {message && (
          <div className={`profile-message ${messageType}`}>
            {message}
          </div>
        )}

        <div className="profile-content">
          {!isEditing ? (
            // View Mode
            <>
              <div className="profile-card-modern">
                <div className="profile-card-background">
                  {profileData?.photoURL ? (
                    <img src={profileData.photoURL} alt="Profile" className="profile-card-image" />
                  ) : (
                    <div className="profile-card-placeholder">
                      {(profileData?.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="profile-card-content">
                  <h2>{profileData?.displayName || 'Anonymous User'}</h2>
                  <div className="profile-card-details">
                    <p className="profile-email">✉️ {user.email}</p>
                    {profileData?.location && (
                      <p className="profile-location">📍 {profileData.location}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="stats-section">
                <div className="stat-card">
                  <div className="stat-value">{totalScore}</div>
                  <div className="stat-label">Total Score</div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-value">{Object.keys(topicScores).length}</div>
                  <div className="stat-label">Topics Played</div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-value">
                    {(() => {
                      if (!profileData?.joinedAt) return 'Unknown';
                      
                      try {
                        let date: Date;
                        
                        if (profileData.joinedAt instanceof Date) {
                          date = profileData.joinedAt;
                        } else if (typeof profileData.joinedAt === 'string') {
                          date = new Date(profileData.joinedAt);
                        } else if (profileData.joinedAt && typeof profileData.joinedAt === 'object' && 'seconds' in profileData.joinedAt) {
                          // Handle Firebase Timestamp
                          const timestamp = profileData.joinedAt as { seconds: number; nanoseconds: number };
                          date = new Date(timestamp.seconds * 1000);
                        } else {
                          date = new Date(profileData.joinedAt);
                        }
                        
                        // Check if date is valid
                        if (isNaN(date.getTime())) {
                          return 'Unknown';
                        }
                        
                        return date.toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        });
                      } catch (error) {
                        console.error('Error formatting joinedAt date:', error);
                        return 'Unknown';
                      }
                    })()}
                  </div>
                  <div className="stat-label">Member Since</div>
                </div>
              </div>

              {Object.keys(topicScores).length > 0 && (
                <div className="high-scores-section">
                  <h4>High Scores by Topic</h4>
                  <div className="scores-grid">
                    {Object.entries(topicScores)
                      .sort(([,a], [,b]) => (b as number) - (a as number))
                      .slice(0, 6)
                      .map(([topic, score]) => (
                      <div key={topic} className="score-item">
                        <span className="topic-name">{topic}</span>
                        <span className="score-value">{score as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="profile-actions">
                <button onClick={handleSignOut} className="signout-btn">
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            // Edit Mode
            <form onSubmit={handleSaveProfile} className="profile-edit-form">
              <div className="edit-avatar-section">
                <div className="avatar-section">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile Preview" className="user-avatar" />
                  ) : (
                    <div className="user-avatar-placeholder">
                      {(displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="avatar-upload">
                  <input
                    type="file"
                    id="profile-picture"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="file-input"
                    disabled={uploadingImage || isSaving}
                  />
                  <label htmlFor="profile-picture" className="file-label">
                    {uploadingImage ? 'Uploading...' : 'Change Picture'}
                  </label>
                  <p className="file-help">Max 5MB, JPG/PNG</p>
                </div>
              </div>

              <div className="edit-fields">
                <div className="form-group">
                  <label htmlFor="edit-name">Display Name *</label>
                  <input
                    type="text"
                    id="edit-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    disabled={isSaving}
                    className="form-input"
                    maxLength={50}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-location">Location</label>
                  <input
                    type="text"
                    id="edit-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Lagos, Nigeria"
                    disabled={isSaving}
                    className="form-input"
                    maxLength={100}
                  />
                </div>

                <div className="password-section">
                  <h4>Change Password (Optional)</h4>
                  <div className="form-group">
                    <PasswordInput
                      value={newPassword}
                      onChange={setNewPassword}
                      label="New Password"
                      id="new-password"
                      placeholder="Leave empty to keep current password"
                      disabled={isSaving}
                    />
                  </div>

                  {newPassword && (
                    <div className="form-group">
                      <PasswordInput
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        label="Confirm New Password"
                        id="confirm-password"
                        placeholder="Confirm your new password"
                        disabled={isSaving}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="edit-actions">
                <button
                  type="button"
                  onClick={handleTestStorage}
                  className="test-btn"
                  style={{ backgroundColor: '#3498db', marginRight: '10px' }}
                >
                  Test Storage
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="cancel-btn"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="save-btn"
                  disabled={isSaving || uploadingImage}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};