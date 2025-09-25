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
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'quiz-stats' | 'questions' | 'system'>('overview');
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
      </div>
    </div>
  );
};

export default AdminDashboard;