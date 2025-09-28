import React, { useState, useEffect } from 'react';
import { useQuizStore } from '../store';
import CustomLoader from './CustomLoader';

interface QuizSetupProps {
  isGuestMode?: boolean;
}

const QuizSetup: React.FC<QuizSetupProps> = ({ isGuestMode = false }) => {
  const { startQuiz, getAvailableTopics, initializeQuestions, isLoadingQuestions } = useQuizStore();
  const [selectedTopic, setSelectedTopic] = useState<string>('All Topics');
  const [topics, setTopics] = useState<string[]>(['All Topics']);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);

  // Initialize questions and load topics
  useEffect(() => {
    const loadTopics = async () => {
      setIsLoadingTopics(true);
      try {
        // Initialize questions service first
        await initializeQuestions();
        
        // Then get available topics
        const availableTopics = await getAvailableTopics();
        setTopics(availableTopics);
      } catch (error) {
        console.error('Error loading topics:', error);
        setTopics(['All Topics']); // Fallback
      } finally {
        setIsLoadingTopics(false);
      }
    };

    loadTopics();
  }, [initializeQuestions, getAvailableTopics]);

  const handleStartQuiz = async () => {
    try {
      await startQuiz(selectedTopic, isGuestMode);
    } catch (error) {
      console.error('Error starting quiz:', error);
    }
  };

  return (
    <div className="quiz-setup">
      <div className="card">
        <h2>Regular Quiz</h2>
        <p>Test your knowledge of Islam with our comprehensive quiz!</p>
        
        {isGuestMode && (
          <div style={{ 
            background: '#fff3cd', 
            color: '#856404', 
            padding: '12px', 
            borderRadius: '8px', 
            margin: '16px 0',
            border: '1px solid #ffeaa7',
            fontSize: '14px'
          }}>
            👤 <strong>Guest Mode:</strong> Your scores won't be saved to leaderboards. Sign in to track your progress!
          </div>
        )}
        
        <div className="setup-form">
          <label htmlFor="category">Choose Category:</label>
          <select
            id="category"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            disabled={isLoadingTopics || isLoadingQuestions}
          >
            {isLoadingTopics ? (
              <option>Loading topics...</option>
            ) : (
              topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))
            )}
          </select>

          <button 
            className="btn btn-primary"
            onClick={handleStartQuiz}
            disabled={isLoadingTopics || isLoadingQuestions}
          >
            {isLoadingQuestions ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CustomLoader size="small" text="" />
                Loading Quiz...
              </div>
            ) : 'Start Quiz'}
          </button>
        </div>

        <div className="quiz-info">
          <h3>Quiz Features:</h3>
          <div className="feature-badges">
            <span className="feature-badge">Multiple categories covering various Islamic topics</span>
            <span className="feature-badge">Detailed explanations for each answer</span>
            <span className="feature-badge">Progress tracking</span>
            <span className="feature-badge">Score calculation</span>
            <span className="feature-badge">All available questions per quiz</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizSetup;
