import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import type { Question } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import CustomLoader from './CustomLoader';
import './QuestionList.css';

interface QuestionListProps {
  questions: (Question & {
    isActive?: boolean;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    createdBy?: string;
  })[];
  onEditQuestion: (question: Question) => void;
  onDeleteQuestion: (questionId: string) => Promise<void>;
  onToggleQuestion?: (questionId: string, isActive: boolean) => Promise<void>;
  isLoading?: boolean;
}

export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  onEditQuestion,
  onDeleteQuestion,
  onToggleQuestion,
  isLoading = false
}) => {
  const { showNotification } = useNotifications();
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Get unique topics
  const topics = ['All', ...new Set(questions.map(q => q.topic))].sort();

  // Filter questions
  const filteredQuestions = questions.filter(question => {
    const matchesToic = selectedTopic === 'All' || question.topic === selectedTopic;
    const matchesSearch = searchQuery === '' || 
      question.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.topic.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesToic && matchesSearch;
  });

  const handleDelete = async (questionId: string, questionText: string) => {
    if (!questionId) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this question?\n\n"${questionText.substring(0, 100)}${questionText.length > 100 ? '...' : ''}"\n\nThis action cannot be undone.`
    );
    
    if (!confirmDelete) return;
    
    setDeletingId(questionId);
    
    try {
      await onDeleteQuestion(questionId);
      showNotification({ message: 'Question deleted successfully', type: 'success' });
    } catch (error) {
      console.error('Error deleting question:', error);
      showNotification({ message: 'Failed to delete question', type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (questionId: string, currentStatus: boolean) => {
    if (!questionId || !onToggleQuestion) return;
    
    setTogglingId(questionId);
    
    try {
      await onToggleQuestion(questionId, !currentStatus);
      showNotification({
        message: `Question ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error toggling question status:', error);
      showNotification({ message: 'Failed to update question status', type: 'error' });
    } finally {
      setTogglingId(null);
    }
  };

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'N/A';
    
    try {
      // Handle Firebase Timestamp - it has a toDate method
      const date = timestamp.toDate();
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  if (isLoading) {
    return <CustomLoader text="Loading questions..." />;
  }

  return (
    <div className="question-list">
      {/* Header with filters */}
      <div className="question-list-header">
        <div className="filters-row">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <div className="topic-filter">
            <label htmlFor="topic-select">Filter by topic:</label>
            <select
              id="topic-select"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="topic-select"
            >
              {topics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="results-info">
          Showing {filteredQuestions.length} of {questions.length} questions
        </div>
      </div>

      {/* Questions list */}
      <div className="questions-container">
        {filteredQuestions.length === 0 ? (
          <div className="no-questions">
            <p>No questions found matching your criteria.</p>
          </div>
        ) : (
          filteredQuestions.map((question) => (
            <div 
              key={question.id} 
              className={`question-card ${question.isActive === false ? 'inactive' : ''}`}
            >
              <div className="question-header">
                <div className="question-meta">
                  <span className="question-topic">{question.topic}</span>
                  {question.isActive === false && (
                    <span className="inactive-badge">Inactive</span>
                  )}
                </div>
                <div className="question-actions">
                  {onToggleQuestion && (
                    <button
                      onClick={() => handleToggle(question.id!, question.isActive !== false)}
                      disabled={togglingId === question.id}
                      className={`toggle-btn ${question.isActive === false ? 'activate' : 'deactivate'}`}
                      title={question.isActive === false ? 'Activate question' : 'Deactivate question'}
                    >
                      {togglingId === question.id ? '...' : (question.isActive === false ? '👁️' : '🚫')}
                    </button>
                  )}
                  <button
                    onClick={() => onEditQuestion(question)}
                    className="edit-btn"
                    title="Edit question"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(question.id!, question.question)}
                    disabled={deletingId === question.id}
                    className="delete-btn"
                    title="Delete question"
                  >
                    {deletingId === question.id ? '...' : '🗑️'}
                  </button>
                </div>
              </div>

              <div className="question-content">
                <h3 className="question-text">{question.question}</h3>
                
                <div className="question-options">
                  {question.options.map((option, index) => (
                    <div 
                      key={index} 
                      className={`option ${option === question.answer ? 'correct' : ''}`}
                    >
                      <span className="option-letter">{String.fromCharCode(65 + index)}.</span>
                      <span className="option-text">{option}</span>
                      {option === question.answer && (
                        <span className="correct-indicator" title="Correct answer">✓</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="question-explanation">
                  <strong>Explanation:</strong> {question.explanation}
                </div>

                {(question.createdAt || question.updatedAt) && (
                  <div className="question-timestamps">
                    {question.createdAt && (
                      <span className="timestamp">
                        Created: {formatDate(question.createdAt)}
                      </span>
                    )}
                    {question.updatedAt && question.updatedAt !== question.createdAt && (
                      <span className="timestamp">
                        Updated: {formatDate(question.updatedAt)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};