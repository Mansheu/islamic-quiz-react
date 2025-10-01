import React, { useState, useEffect, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import { getBookmarks, removeBookmark, type BookmarkDoc } from '../firebase/bookmarks';
import BookmarkButton from './BookmarkButton';
import CustomLoader from './CustomLoader';
import InlineNotification from './InlineNotification';
import './BookmarksManager.css';

interface BookmarksManagerProps {
  onStartQuiz?: (bookmarks: BookmarkDoc[]) => void;
  onClose?: () => void;
}

const BookmarksManager: React.FC<BookmarksManagerProps> = ({ onStartQuiz, onClose }) => {
  const [user] = useAuthState(auth);
  const [bookmarks, setBookmarks] = useState<BookmarkDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All Topics');
  const [sortBy, setSortBy] = useState<'date' | 'topic' | 'question'>('date');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  
  // Inline notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
    visible: boolean;
  } | null>(null);

  // Helper function to show inline notification
  const showInlineNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type, visible: true });
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setNotification(prev => prev ? { ...prev, visible: false } : null);
    }, 3000);
  }, []);

  // Helper function to hide notification immediately
  const hideNotification = useCallback(() => {
    setNotification(prev => prev ? { ...prev, visible: false } : null);
  }, []);

  const loadBookmarks = useCallback(async () => {
    if (!user) {
      setBookmarks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const bookmarksData = await getBookmarks(user.uid);
      setBookmarks(bookmarksData);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      showInlineNotification('Failed to load bookmarks', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showInlineNotification]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const handleRemoveBookmark = async (bookmark: BookmarkDoc) => {
    if (!user) return;

    try {
      await removeBookmark(user.uid, {
        question: bookmark.question,
        answer: bookmark.answer,
        options: bookmark.options,
        topic: bookmark.topic,
        explanation: '', // Not needed for removal
        id: bookmark.questionId
      });

      setBookmarks(prev => prev.filter(b => b.key !== bookmark.key));
      showInlineNotification('Removed from bookmarks', 'success');
    } catch (error) {
      console.error('Error removing bookmark:', error);
      showInlineNotification('Failed to remove bookmark', 'error');
    }
  };

  const handleClearAllBookmarks = async () => {
    if (!user || clearingAll) return;

    setClearingAll(true);
    let successCount = 0;

    try {
      // Remove all bookmarks one by one
      for (const bookmark of bookmarks) {
        try {
          await removeBookmark(user.uid, {
            question: bookmark.question,
            answer: bookmark.answer,
            options: bookmark.options,
            topic: bookmark.topic,
            explanation: '', // Not needed for removal
            id: bookmark.questionId
          });
          successCount++;
        } catch (error) {
          console.error('Error removing bookmark:', bookmark.key, error);
        }
      }

      setBookmarks([]);
      showInlineNotification(`Cleared ${successCount} bookmarks`, 'success');
    } catch (error) {
      console.error('Error clearing bookmarks:', error);
      showInlineNotification('Failed to clear all bookmarks', 'error');
    } finally {
      setClearingAll(false);
      setShowClearConfirm(false);
    }
  };

  // Get unique topics
  const topics = ['All Topics', ...new Set(bookmarks.map(b => b.topic))].sort();

  // Filter and sort bookmarks
  const filteredBookmarks = bookmarks
    .filter(bookmark => {
      const matchesSearch = searchQuery === '' || 
        bookmark.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.topic.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTopic = selectedTopic === 'All Topics' || bookmark.topic === selectedTopic;
      
      return matchesSearch && matchesTopic;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date': {
          // Sort by creation date (newest first)
          const dateA = a.createdAt && typeof a.createdAt === 'object' && 'toDate' in a.createdAt 
            ? a.createdAt.toDate().getTime() 
            : 0;
          const dateB = b.createdAt && typeof b.createdAt === 'object' && 'toDate' in b.createdAt 
            ? b.createdAt.toDate().getTime() 
            : 0;
          return dateB - dateA;
        }
        case 'topic':
          return a.topic.localeCompare(b.topic);
        case 'question':
          return a.question.localeCompare(b.question);
        default:
          return 0;
      }
    });

  const formatDate = (timestamp: unknown) => {
    if (!timestamp) return 'Unknown';
    const ts = timestamp as { toDate?: () => Date };
    const date = ts.toDate ? ts.toDate() : new Date(timestamp as string);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (!user) {
    return (
      <div className="bookmarks-manager">
        <div className="bookmarks-empty">
          <h2>📚 Your Bookmarks</h2>
          <p>Sign in to view and manage your saved questions.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bookmarks-manager">
        <CustomLoader text="Loading your bookmarks..." />
      </div>
    );
  }

  return (
    <div className="bookmarks-manager">
      {/* Inline Notification */}
      {notification && (
        <InlineNotification
          type={notification.type}
          message={notification.message}
          isVisible={notification.visible}
          onDismiss={hideNotification}
          autoClose={true}
          autoCloseDelay={3000}
          showIcon={true}
          showCloseButton={true}
        />
      )}
      
      <div className="bookmarks-header">
        <div className="bookmarks-title">
          <h2>📚 Your Bookmarks</h2>
          <span className="bookmarks-count">
            {filteredBookmarks.length} of {bookmarks.length} question{bookmarks.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="bookmarks-actions">
          {bookmarks.length > 0 && onStartQuiz && (
            <button
              className="btn btn-primary"
              onClick={() => onStartQuiz(filteredBookmarks)}
              disabled={filteredBookmarks.length === 0}
            >
              🎯 Quiz Selected ({filteredBookmarks.length})
            </button>
          )}
          {bookmarks.length > 0 && (
            <button
              className="btn btn-danger"
              onClick={() => setShowClearConfirm(true)}
              disabled={clearingAll}
            >
              🗑️ Clear All
            </button>
          )}
          {onClose && (
            <button className="btn btn-secondary" onClick={onClose}>
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="bookmarks-empty">
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <h3>No bookmarks yet</h3>
            <p>
              Start saving questions during quizzes to build your personal review collection. 
              Look for the bookmark button next to each question!
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Filters and controls */}
          <div className="bookmarks-filters">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search questions, answers, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>

            <div className="filter-controls">
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="topic-select"
              >
                {topics.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'topic' | 'question')}
                className="sort-select"
              >
                <option value="date">Sort by Date</option>
                <option value="topic">Sort by Topic</option>
                <option value="question">Sort by Question</option>
              </select>
            </div>
          </div>

          {/* Bookmarks list */}
          {filteredBookmarks.length === 0 ? (
            <div className="no-results">
              <p>No bookmarks match your current filters.</p>
            </div>
          ) : (
            <div className="bookmarks-list">
              {filteredBookmarks.map((bookmark) => (
                <div key={bookmark.key} className="bookmark-card">
                  <div className="bookmark-header">
                    <span className="bookmark-topic">{bookmark.topic}</span>
                    <div className="bookmark-actions">
                      <BookmarkButton
                        isBookmarked={true}
                        onToggle={() => handleRemoveBookmark(bookmark)}
                        size="small"
                      />
                    </div>
                  </div>

                  <div className="bookmark-content">
                    <h4 className="bookmark-question">{bookmark.question}</h4>
                    <p className="bookmark-answer">
                      <strong>Answer:</strong> {bookmark.answer}
                    </p>
                  </div>

                  <div className="bookmark-meta">
                    <span className="bookmark-date">
                      Saved {formatDate(bookmark.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => !clearingAll && setShowClearConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>🗑️ Clear All Bookmarks?</h3>
            <p>
              Are you sure you want to remove all {bookmarks.length} bookmarked questions? 
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowClearConfirm(false)}
                disabled={clearingAll}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleClearAllBookmarks}
                disabled={clearingAll}
              >
                {clearingAll ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CustomLoader size="small" text="" />
                    Clearing...
                  </div>
                ) : (
                  'Clear All Bookmarks'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookmarksManager;