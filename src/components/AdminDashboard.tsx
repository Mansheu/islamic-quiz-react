import React, { useState, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'quiz-stats' | 'system'>('overview');
  const [error, setError] = useState<string | null>(null);

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
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading admin dashboard...</p>
          </div>
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