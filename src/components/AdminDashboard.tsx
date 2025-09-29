import React, { useState, useEffect, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import { 
  isAdmin,
  getAdminAnalytics,
  getAllUsers,
  getQuizStatsByTopic,
  getSystemHealth,
  adminUpdateUser,
  adminDeleteUser,
  resetAllUserScores,
  resetUserScores,
  resetUserTimedChallenges,
  type AdminAnalytics,
  type AdminUser
} from '../firebase/admin';
import { 
  getAllQuestionsForAdmin,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  bulkImportQuestions 
} from '../firebase/questions';
import { Timestamp } from 'firebase/firestore';
import { QuestionEditor } from './QuestionEditor';
import { QuestionList } from './QuestionList';
import { allQuestions } from '../data/questions';
import { QuestionService } from '../services/questionService';
import type { Question } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import CustomLoader from './CustomLoader';
import './AdminDashboard.css';

interface SystemHealth {
  dbConnectionStatus: 'healthy' | 'warning' | 'error';
  totalDocuments: number;
  averageResponseTime: number;
  errorRate: number;
}

const AdminDashboard: React.FC = () => {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [quizStats, setQuizStats] = useState<Array<{
    topic: string;
    totalPlayers: number;
    averageScore: number;
    highestScore: number;
    completionRate: number;
  }>>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'quiz-stats' | 'questions' | 'system' | 'admin-actions'>('overview');
  const [error, setError] = useState<string | null>(null);
  
  // Questions management state
  const { showNotification } = useNotifications();
  const [questions, setQuestions] = useState<(Question & {
    isActive?: boolean;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    createdBy?: string;
  })[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false);
  const [staticSyncLoading, setStaticSyncLoading] = useState(false);

  // Load admin data
  const loadAdminData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [analyticsData, usersData, quizStatsData, systemHealthData] = await Promise.all([
        getAdminAnalytics(),
        getAllUsers(),
        getQuizStatsByTopic(),
        getSystemHealth()
      ]);
      
      setAnalytics(analyticsData);
      setUsers(usersData);
      setQuizStats(quizStatsData);
      setSystemHealth(systemHealthData);
      
    } catch (err) {
      console.error('Error loading admin data:', err);
      setError('Failed to load admin data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Load questions from Firebase
  const loadQuestions = useCallback(async () => {
    setQuestionsLoading(true);
    try {
      const questionsData = await getAllQuestionsForAdmin();
      setQuestions(questionsData);
      
      // Check if we should show migration prompt (no questions in Firebase but static questions exist)
      if (questionsData.length === 0 && allQuestions.length > 0) {
        setShowMigrationPrompt(true);
      }
    } catch (err) {
      console.error('Error loading questions:', err);
      showNotification({ message: 'Failed to load questions', type: 'error' });
    } finally {
      setQuestionsLoading(false);
    }
  }, [showNotification]);

  // Load questions when questions tab is selected
  useEffect(() => {
    if (activeTab === 'questions') {
      loadQuestions();
    }
  }, [activeTab, loadQuestions]);

  // Handle saving question (create or update)
  const handleSaveQuestion = async (questionData: Omit<Question, 'id'>) => {
    if (!user) return;

    try {
      if (editingQuestion?.id) {
        // Update existing question
        await updateQuestion(editingQuestion.id, questionData);
        showNotification({ message: 'Question updated successfully!', type: 'success' });
      } else {
        // Create new question
        await addQuestion(questionData, user.uid);
        showNotification({ message: 'Question created successfully!', type: 'success' });
      }
      
      // Refresh questions list and close editor
      await loadQuestions();
      setShowQuestionEditor(false);
      setEditingQuestion(null);
    } catch (error) {
      console.error('Error saving question:', error);
      showNotification({ message: 'Failed to save question', type: 'error' });
    }
  };

  // Handle editing a question
  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowQuestionEditor(true);
  };

  // Handle deleting a question
  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await deleteQuestion(questionId);
      showNotification({ message: 'Question deleted successfully', type: 'success' });
      await loadQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      showNotification({ message: 'Failed to delete question', type: 'error' });
    }
  };

  // Handle toggling question active status
  const handleToggleQuestion = async (questionId: string, isActive: boolean) => {
    try {
      await updateQuestion(questionId, { isActive: isActive });
      await loadQuestions();
    } catch (error) {
      console.error('Error toggling question:', error);
      throw error; // Re-throw to be handled by QuestionList
    }
  };

  // Handle migration from static data
  const handleMigrateQuestions = async () => {
    if (!user) return;
    
    try {
      setQuestionsLoading(true);
      await bulkImportQuestions(allQuestions, user.uid);
      showNotification({ message: `Successfully imported ${allQuestions.length} questions!`, type: 'success' });
      setShowMigrationPrompt(false);
      await loadQuestions();
    } catch (error) {
      console.error('Error migrating questions:', error);
      showNotification({ message: 'Failed to migrate questions', type: 'error' });
    } finally {
      setQuestionsLoading(false);
    }
  };

  // Sync all static questions (adds only missing across all topics)
  const handleSyncStaticQuestions = async () => {
    if (!user) return;
    try {
      setStaticSyncLoading(true);
      const key = (q: Pick<Question, 'question' | 'answer'>) => `${q.question}__${q.answer}`.toLowerCase();
      const existingKeys = new Set(questions.map(q => key(q)));
      const missing = allQuestions.filter(q => !existingKeys.has(key(q)));

      if (missing.length === 0) {
        showNotification({ message: 'All static questions are already synced.', type: 'success' });
        return;
      }

      await bulkImportQuestions(missing.map(q => ({
        question: q.question,
        options: q.options,
        answer: q.answer,
        topic: q.topic,
        explanation: q.explanation,
      })), user.uid);

      showNotification({ message: `Synced ${missing.length} static questions to Firestore`, type: 'success' });
      await loadQuestions();
      // Ensure quiz service uses latest Firestore data
      QuestionService.enableFirebaseMode();
      await QuestionService.refresh();
    } catch (error) {
      console.error('Error syncing static questions:', error);
      showNotification({ message: 'Failed to sync static questions', type: 'error' });
    } finally {
      setStaticSyncLoading(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string, displayName: string) => {
    if (window.confirm(`Are you sure you want to delete user "${displayName}"? This action cannot be undone.`)) {
      try {
        await adminDeleteUser(userId);
        setUsers(users.filter(u => u.uid !== userId));
        alert('User deleted successfully.');
      } catch (err) {
        console.error('Error deleting user:', err);
        alert('Error deleting user. Please try again.');
      }
    }
  };

  // Handle user score reset
  const handleResetUserScores = async (userId: string, displayName: string) => {
    if (window.confirm(`Are you sure you want to reset all scores and achievements for user "${displayName}"?\n\nThis will delete:\n- All quiz scores\n- All achievements\n- Daily streaks\n- Timed challenge records\n\nThis action cannot be undone.`)) {
      try {
        const result = await resetUserScores(userId);
        if (result.success) {
          showNotification({ message: `✅ Scores reset for ${displayName}`, type: 'success' });
          await loadAdminData(); // Refresh the data
        } else {
          showNotification({ message: `❌ Failed to reset scores: ${result.message}`, type: 'error' });
        }
      } catch (err) {
        console.error('Error resetting user scores:', err);
        showNotification({ message: 'Error resetting user scores. Please try again.', type: 'error' });
      }
    }
  };

  // Handle user timed challenges reset
  const handleResetUserTimedChallenges = async (userId: string, displayName: string) => {
    if (window.confirm(`Are you sure you want to reset ONLY the timed challenge records for user "${displayName}"?\n\nThis will delete:\n- Timed challenge scores and grades\n- Personal best records\n- Challenge completion history\n\nRegular quiz achievements and streaks will be preserved.\n\nThis action cannot be undone.`)) {
      try {
        const result = await resetUserTimedChallenges(userId);
        if (result.success) {
          showNotification({ message: `✅ Timed challenge records reset for ${displayName}`, type: 'success' });
          await loadAdminData(); // Refresh the data
        } else {
          showNotification({ message: `❌ Failed to reset timed challenges: ${result.message}`, type: 'error' });
        }
      } catch (err) {
        console.error('Error resetting user timed challenges:', err);
        showNotification({ message: 'Error resetting timed challenges. Please try again.', type: 'error' });
      }
    }
  };

  // Handle user update
  const handleUpdateUser = async (userId: string, updates: Partial<{ displayName: string; totalScore: number; isBlocked: boolean }>) => {
    try {
      await adminUpdateUser(userId, updates);
      setUsers(users.map(u => u.uid === userId ? { ...u, ...updates } : u));
      alert('User updated successfully.');
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Error updating user. Please try again.');
    }
  };

  // Check if user is admin
  if (!user || !isAdmin(user.email)) {
    return (
      <div className="admin-dashboard">
        <div className="card">
          <div className="access-denied">
            <h2>🔒 Access Denied</h2>
            <p>You don't have permission to access the admin dashboard.</p>
            <p>Please contact the administrator if you believe this is an error.</p>
          </div>
        </div>
      </div>
    );
  }

  // Format date display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="card">
          <CustomLoader text="Loading admin dashboard..." />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="card">
        <div className="admin-header">
          <h2>🛠️ Admin Dashboard</h2>
        </div>
        <div className="welcome-message">
          <p>Welcome, Administrator {user.displayName || user.email}</p>
        </div>

        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users ({users.length})
          </button>
          <button 
            className={`admin-tab ${activeTab === 'quiz-stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz-stats')}
          >
            🎯 Quiz Stats
          </button>
          <button 
            className={`admin-tab ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            ❓ Questions
          </button>
          <button 
            className={`admin-tab ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            ⚙️ System
          </button>
          <button 
            className={`admin-tab ${activeTab === 'admin-actions' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin-actions')}
          >
            🔧 Admin Actions
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && analytics && (
          <div className="admin-content">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>{analytics.totalUsers}</h3>
                  <p>Total Users</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-info">
                  <h3>{analytics.totalQuizzesTaken}</h3>
                  <p>Quizzes Completed</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-info">
                  <h3>{analytics.averageScore}</h3>
                  <p>Average Score</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">🔥</div>
                <div className="stat-info">
                  <h3>{analytics.recentActivity.length}</h3>
                  <p>Recent Activities</p>
                </div>
              </div>
            </div>

            <div className="admin-sections">
              <div className="admin-section">
                <h3>🏆 Top Quiz Topics</h3>
                <div className="topic-list">
                  {analytics.topTopics.map((topic, index) => (
                    <div key={topic.topic} className="topic-item">
                      <span className="topic-rank">#{index + 1}</span>
                      <span className="topic-name">{topic.topic}</span>
                      <span className="topic-count">{topic.count} players</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-section">
                <h3>⚡ Recent Activity</h3>
                <div className="activity-list">
                  {analytics.recentActivity.slice(0, 10).map((activity, index) => (
                    <div key={index} className="activity-item">
                      <span className="activity-user">{activity.displayName}</span>
                      <span className="activity-action">{activity.action}</span>
                      <span className="activity-time">{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="admin-content">
            <div className="users-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Total Score</th>
                    <th>Quizzes</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.uid} className={!user.isActive ? 'inactive-user' : ''}>
                      <td>
                        <div className="user-info">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName} className="user-avatar-tiny" />
                          ) : (
                            <div className="user-avatar-tiny">
                              {user.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span>{user.displayName}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td className="score-cell">{user.totalScore.toLocaleString()}</td>
                      <td>{user.quizzesCompleted}</td>
                      <td>{formatDate(user.joinedAt)}</td>
                      <td>
                        <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="user-actions">
                          <button 
                            onClick={() => {
                              const newScore = prompt('Enter new total score:', user.totalScore.toString());
                              if (newScore && !isNaN(Number(newScore))) {
                                handleUpdateUser(user.uid, { totalScore: Number(newScore) });
                              }
                            }}
                            className="btn-small btn-secondary"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleResetUserTimedChallenges(user.uid, user.displayName)}
                            className="btn-small btn-info"
                            style={{ backgroundColor: '#2196F3', borderColor: '#2196F3', color: 'white' }}
                            title="Reset only timed challenge records"
                          >
                            Reset Timed
                          </button>
                          <button 
                            onClick={() => handleResetUserScores(user.uid, user.displayName)}
                            className="btn-small btn-warning"
                            style={{ backgroundColor: '#ff9800', borderColor: '#ff9800' }}
                            title="Reset all scores and achievements"
                          >
                            Reset All
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.uid, user.displayName)}
                            className="btn-small btn-danger"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quiz Stats Tab */}
        {activeTab === 'quiz-stats' && (
          <div className="admin-content">
            <div className="quiz-stats-grid">
              {quizStats.map((stat) => (
                <div key={stat.topic} className="quiz-stat-card">
                  <h4>{stat.topic}</h4>
                  <div className="stat-details">
                    <div className="stat-row">
                      <span>Total Players:</span>
                      <span>{stat.totalPlayers}</span>
                    </div>
                    <div className="stat-row">
                      <span>Average Score:</span>
                      <span>{stat.averageScore}</span>
                    </div>
                    <div className="stat-row">
                      <span>Highest Score:</span>
                      <span>{stat.highestScore}</span>
                    </div>
                    <div className="stat-row">
                      <span>Completion Rate:</span>
                      <span>{stat.completionRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="admin-content">
            {/* Migration Prompt */}
            {showMigrationPrompt && (
              <div className="migration-prompt">
                <h3>📦 Migrate Questions</h3>
                <p>
                  We found {allQuestions.length} questions in your static data file that haven't been migrated to Firebase yet. 
                  Would you like to import them now?
                </p>
                <div className="migration-actions">
                  <button 
                    className="btn btn-primary" 
                    onClick={handleMigrateQuestions}
                    disabled={questionsLoading}
                  >
                    {questionsLoading ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CustomLoader size="small" text="" />
                        Importing...
                      </div>
                    ) : `Import ${allQuestions.length} Questions`}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setShowMigrationPrompt(false)}
                    disabled={questionsLoading}
                  >
                    Skip for Now
                  </button>
                </div>
              </div>
            )}

            {/* Static Questions Sync */}
            {(() => {
              const key = (q: Pick<Question, 'question' | 'answer'>) => `${q.question}__${q.answer}`.toLowerCase();
              const existingKeys = new Set(questions.map(q => key(q)));
              const curatedCount = allQuestions.length;
              const missingCount = allQuestions.filter(q => !existingKeys.has(key(q))).length;
              if (missingCount === 0) return null;
              const inFirestore = curatedCount - missingCount;
              return (
                <div className="migration-prompt" style={{ marginTop: showMigrationPrompt ? 16 : 0 }}>
                  <h3>Static Questions Sync</h3>
                  <p>
                    Static questions available: {curatedCount}. In Firestore: {inFirestore}. Missing: {missingCount}.
                  </p>
                  <div className="migration-actions">
                    <button
                      className="btn btn-primary"
                      onClick={handleSyncStaticQuestions}
                      disabled={staticSyncLoading || missingCount === 0}
                    >
                      {staticSyncLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CustomLoader size="small" text="" />
                          Syncing...
                        </div>
                      ) : 'Sync Static Questions to Firestore'}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Questions Management Header */}
            <div className="questions-header">
              <div className="questions-title">
                <h3>❓ Questions Management</h3>
                <span className="questions-count">
                  {questions.length} question{questions.length !== 1 ? 's' : ''} total
                </span>
              </div>
              <div className="questions-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowQuestionEditor(true)}
                  disabled={showQuestionEditor}
                >
                  ➕ Add New Question
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={loadQuestions}
                  disabled={questionsLoading}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            {/* Question Editor */}
            {showQuestionEditor && (
              <div className="question-editor-container">
                <QuestionEditor
                  question={editingQuestion}
                  onSave={handleSaveQuestion}
                  onCancel={() => {
                    setShowQuestionEditor(false);
                    setEditingQuestion(null);
                  }}
                  isEditing={!!editingQuestion}
                />
              </div>
            )}

            {/* Questions List */}
            <div className="questions-list-container">
              <QuestionList
                questions={questions}
                onEditQuestion={handleEditQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onToggleQuestion={handleToggleQuestion}
                isLoading={questionsLoading}
              />
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && systemHealth && (
          <div className="admin-content">
            <div className="system-health">
              <h3>🔧 System Health</h3>
              <div className="health-grid">
                <div className="health-card">
                  <h4>Database Status</h4>
                  <span className={`health-status ${systemHealth.dbConnectionStatus}`}>
                    {systemHealth.dbConnectionStatus.toUpperCase()}
                  </span>
                </div>
                
                <div className="health-card">
                  <h4>Response Time</h4>
                  <span className="health-metric">{systemHealth.averageResponseTime}ms</span>
                </div>
                
                <div className="health-card">
                  <h4>Total Documents</h4>
                  <span className="health-metric">{systemHealth.totalDocuments}</span>
                </div>
                
                <div className="health-card">
                  <h4>Error Rate</h4>
                  <span className="health-metric">{systemHealth.errorRate}%</span>
                </div>
              </div>
            </div>

            <div className="system-actions">
              <h3>⚙️ System Actions</h3>
              <div className="action-buttons">
                <button className="btn btn-secondary" onClick={loadAdminData}>
                  🔄 Refresh All Data
                </button>
                <button className="btn btn-secondary" onClick={() => window.location.reload()}>
                  🔃 Reload Application
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Actions Tab */}
        {activeTab === 'admin-actions' && (
          <div className="admin-content">
            <div className="admin-actions">
              <h3>🔧 Administrative Actions</h3>
              <div className="warning-banner">
                <p>⚠️ <strong>Warning:</strong> These actions are irreversible and will permanently delete user data!</p>
              </div>
              
              <div className="action-section">
                <h4>Score Management</h4>
                <div className="action-buttons">
                  <button 
                    className="btn btn-danger"
                    onClick={async () => {
                      if (window.confirm('⚠️ Are you absolutely sure you want to reset ALL user scores and achievements?\n\nThis will permanently delete:\n- All quiz scores\n- All achievements\n- All daily streaks\n- All timed challenge records\n- All leaderboard data\n\nThis action cannot be undone!')) {
                        if (window.confirm('🚨 FINAL CONFIRMATION: This will delete ALL user data. Type YES to confirm.')) {
                          try {
                            const result = await resetAllUserScores();
                            if (result.success) {
                              showNotification({ message: '✅ All user scores have been reset successfully', type: 'success' });
                              // Clear local persisted timed challenge data
                              localStorage.removeItem('timed-challenge-storage');
                              await loadAdminData(); // Refresh the data
                              // Force reload to ensure all stats are refreshed
                              setTimeout(() => window.location.reload(), 1000);
                            } else {
                              showNotification({ message: `❌ Failed to reset scores: ${result.message}`, type: 'error' });
                            }
                          } catch (error) {
                            showNotification({ message: '❌ Error resetting scores', type: 'error' });
                            console.error('Reset error:', error);
                          }
                        }
                      }
                    }}
                  >
                    🗑️ Reset ALL User Scores
                  </button>
                </div>
                <p className="action-description">
                  Permanently deletes all quiz scores, achievements, streaks, and leaderboard data for ALL users.
                </p>
              </div>

              <div className="action-section">
                <h4>Individual User Actions</h4>
                <p className="action-description">
                  To reset scores for individual users, use the "Reset Scores" button in the Users tab.
                </p>
              </div>

              <div className="action-section">
                <h4>Data Export</h4>
                <div className="action-buttons">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      // Export user data as JSON
                      const data = {
                        users: users,
                        analytics: analytics,
                        timestamp: new Date().toISOString()
                      };
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `admin-data-export-${new Date().toISOString().split('T')[0]}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      showNotification({ message: '📊 Admin data exported successfully', type: 'success' });
                    }}
                  >
                    📊 Export Admin Data
                  </button>
                </div>
                <p className="action-description">
                  Export all admin analytics and user data as a JSON file for backup purposes.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
