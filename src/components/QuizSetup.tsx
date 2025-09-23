import React, { useState } from 'react';
import { useQuizStore } from '../store';

interface QuizSetupProps {
  isGuestMode?: boolean;
}

const QuizSetup: React.FC<QuizSetupProps> = ({ isGuestMode = false }) => {
  const { startQuiz, getAvailableTopics } = useQuizStore();
  const [selectedTopic, setSelectedTopic] = useState<string>('All Topics');
  
  const topics = getAvailableTopics();

  const handleStartQuiz = () => {
    startQuiz(selectedTopic, isGuestMode);
  };

  return (
    <div className="quiz-setup">
      <div className="card">
        <h2>Islamic Quiz App</h2>
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
          >
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>

          <button 
            className="btn btn-primary"
            onClick={handleStartQuiz}
          >
            Start Quiz
          </button>
        </div>

        <div className="quiz-info">
          <h3>Quiz Features:</h3>
          <ul>
            <li>✅ Multiple categories covering various Islamic topics</li>
            <li>✅ Detailed explanations for each answer</li>
            <li>✅ Progress tracking</li>
            <li>✅ Score calculation</li>
            <li>✅ 10 randomized questions per quiz</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QuizSetup;