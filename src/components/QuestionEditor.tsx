import React, { useState, useEffect } from 'react';
import type { Question } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import './QuestionEditor.css';

interface QuestionEditorProps {
  question?: Question | null;
  onSave: (question: Omit<Question, 'id'>) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

const TOPIC_SUGGESTIONS = [
  "Quranic Basics",
  "Prophets in Islam",
  "Islamic History",
  "Pillars of Islam",
  "Islamic Jurisprudence",
  "Hadith Knowledge"
];

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  onSave,
  onCancel,
  isEditing = false
}) => {
  const { showNotification } = useNotifications();
  const [formData, setFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    answer: '',
    topic: '',
    explanation: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (question) {
      setFormData({
        question: question.question,
        options: [...question.options],
        answer: question.answer,
        topic: question.topic,
        explanation: question.explanation
      });
    }
  }, [question]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Question validation
    if (!formData.question.trim()) {
      newErrors.question = 'Question is required';
    } else if (formData.question.length < 10) {
      newErrors.question = 'Question must be at least 10 characters long';
    }

    // Options validation
    const filledOptions = formData.options.filter(option => option.trim());
    if (filledOptions.length < 2) {
      newErrors.options = 'At least 2 options are required';
    } else if (filledOptions.length < 4) {
      newErrors.options = 'All 4 options are recommended for better quiz experience';
    }

    // Check for duplicate options
    const uniqueOptions = new Set(formData.options.map(opt => opt.trim().toLowerCase()));
    if (uniqueOptions.size !== filledOptions.length) {
      newErrors.options = 'Options must be unique';
    }

    // Answer validation
    if (!formData.answer.trim()) {
      newErrors.answer = 'Correct answer is required';
    } else if (!formData.options.some(option => option.trim() === formData.answer.trim())) {
      newErrors.answer = 'Answer must match one of the options exactly';
    }

    // Topic validation
    if (!formData.topic.trim()) {
      newErrors.topic = 'Topic is required';
    }

    // Explanation validation
    if (!formData.explanation.trim()) {
      newErrors.explanation = 'Explanation is required';
    } else if (formData.explanation.length < 20) {
      newErrors.explanation = 'Explanation should be at least 20 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
    
    // Clear errors when user starts typing
    if (errors.options || errors.answer) {
      setErrors(prev => ({ ...prev, options: '', answer: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification({ message: 'Please fix the errors before submitting', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSave({
        question: formData.question.trim(),
        options: formData.options.map(opt => opt.trim()),
        answer: formData.answer.trim(),
        topic: formData.topic.trim(),
        explanation: formData.explanation.trim()
      });
      
      showNotification({
        message: isEditing ? 'Question updated successfully!' : 'Question created successfully!',
        type: 'success'
      });
      
      // Reset form if creating new question
      if (!isEditing) {
        setFormData({
          question: '',
          options: ['', '', '', ''],
          answer: '',
          topic: '',
          explanation: ''
        });
      }
    } catch (error) {
      console.error('Error saving question:', error);
      showNotification({ message: 'Failed to save question. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectAnswer = (option: string) => {
    setFormData(prev => ({ ...prev, answer: option }));
    if (errors.answer) {
      setErrors(prev => ({ ...prev, answer: '' }));
    }
  };

  return (
    <div className="question-editor">
      <div className="question-editor-header">
        <h2>{isEditing ? 'Edit Question' : 'Create New Question'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="question-editor-form">
        {/* Question Input */}
        <div className="form-group">
          <label htmlFor="question" className="form-label">
            Question <span className="required">*</span>
          </label>
          <textarea
            id="question"
            value={formData.question}
            onChange={(e) => handleInputChange('question', e.target.value)}
            className={`form-input ${errors.question ? 'error' : ''}`}
            placeholder="Enter your question here..."
            rows={3}
          />
          {errors.question && <span className="error-message">{errors.question}</span>}
        </div>

        {/* Options Input */}
        <div className="form-group">
          <label className="form-label">
            Answer Options <span className="required">*</span>
          </label>
          <div className="options-container">
            {formData.options.map((option, index) => (
              <div key={index} className="option-input-container">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className={`form-input option-input ${errors.options ? 'error' : ''}`}
                  placeholder={`Option ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => selectAnswer(option)}
                  className={`select-answer-btn ${formData.answer === option ? 'selected' : ''}`}
                  disabled={!option.trim()}
                  title="Select as correct answer"
                >
                  ✓
                </button>
              </div>
            ))}
          </div>
          {errors.options && <span className="error-message">{errors.options}</span>}
        </div>

        {/* Correct Answer Display */}
        <div className="form-group">
          <label className="form-label">
            Correct Answer <span className="required">*</span>
          </label>
          <div className={`answer-display ${formData.answer ? 'has-answer' : ''} ${errors.answer ? 'error' : ''}`}>
            {formData.answer || 'Click ✓ next to the correct option above'}
          </div>
          {errors.answer && <span className="error-message">{errors.answer}</span>}
        </div>

        {/* Topic Input */}
        <div className="form-group">
          <label htmlFor="topic" className="form-label">
            Topic <span className="required">*</span>
          </label>
          <input
            type="text"
            id="topic"
            list="topic-suggestions"
            value={formData.topic}
            onChange={(e) => handleInputChange('topic', e.target.value)}
            className={`form-input ${errors.topic ? 'error' : ''}`}
            placeholder="Enter topic or select from suggestions"
          />
          <datalist id="topic-suggestions">
            {TOPIC_SUGGESTIONS.map(topic => (
              <option key={topic} value={topic} />
            ))}
          </datalist>
          {errors.topic && <span className="error-message">{errors.topic}</span>}
        </div>

        {/* Explanation Input */}
        <div className="form-group">
          <label htmlFor="explanation" className="form-label">
            Explanation <span className="required">*</span>
          </label>
          <textarea
            id="explanation"
            value={formData.explanation}
            onChange={(e) => handleInputChange('explanation', e.target.value)}
            className={`form-input ${errors.explanation ? 'error' : ''}`}
            placeholder="Provide a detailed explanation for the correct answer..."
            rows={4}
          />
          {errors.explanation && <span className="error-message">{errors.explanation}</span>}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Question' : 'Create Question')}
          </button>
        </div>
      </form>
    </div>
  );
};