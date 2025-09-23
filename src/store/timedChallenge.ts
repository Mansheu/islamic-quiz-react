import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { allQuestions } from '../data/questions';
import type { TimedChallenge, ChallengeResult, TimedChallengeState } from '../types';

// Challenge configurations
export const timedChallenges: TimedChallenge[] = [
  {
    id: 'speed-5',
    name: 'Speed Run',
    description: 'Quick 5-question challenge to test your reflexes',
    timeLimit: 60, // 1 minute
    questionCount: 5,
    scoreMultiplier: 1.2,
    difficulty: 'easy',
    topic: 'Mixed',
    icon: '⚡'
  },
  {
    id: 'lightning-10',
    name: 'Lightning Round',
    description: 'Fast-paced 10 questions in 2 minutes',
    timeLimit: 120, // 2 minutes
    questionCount: 10,
    scoreMultiplier: 1.5,
    difficulty: 'medium',
    topic: 'Mixed',
    icon: '⚡'
  },
  {
    id: 'blitz-15',
    name: 'Knowledge Blitz',
    description: 'Ultimate 15-question challenge in 3 minutes',
    timeLimit: 180, // 3 minutes
    questionCount: 15,
    scoreMultiplier: 2.0,
    difficulty: 'hard',
    topic: 'Mixed',
    icon: '🔥'
  }
];

// Scoring and grading functions
export const calculateScore = (
  correctAnswers: number,
  totalQuestions: number,
  timeSpent: number,
  timeLimit: number,
  multiplier: number
): number => {
  const accuracy = correctAnswers / totalQuestions;
  const timeBonus = Math.max(0, (timeLimit - timeSpent) / timeLimit);
  const speedBonus = timeBonus * 0.5; // 50% time bonus
  
  return Math.round(((accuracy * 100) + (speedBonus * 50)) * multiplier);
};

export const getGrade = (score: number): string => {
  if (score >= 180) return 'S';
  if (score >= 150) return 'A';
  if (score >= 120) return 'B';
  if (score >= 90) return 'C';
  return 'D';
};

export const getGradeColor = (grade: string): string => {
  switch (grade) {
    case 'S': return '#FFD700'; // Gold
    case 'A': return '#00E676'; // Green
    case 'B': return '#00BCD4'; // Cyan
    case 'C': return '#FF9800'; // Orange
    case 'D': return '#F44336'; // Red
    default: return '#9E9E9E'; // Gray
  }
};

// Zustand store with persistence
export const useTimedChallengeStore = create<TimedChallengeState>()(
  persist(
    (set, get) => ({
  // State
  currentChallenge: null,
  isActive: false,
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  timeRemaining: 0,
  streak: 0,
  results: null,
  personalBests: {},
  isGuestMode: false,

  // Actions
  startChallenge: (challengeId: string, isGuest = false) => {
    const challenge = timedChallenges.find(c => c.id === challengeId);
    if (!challenge) return;

    // Get random questions based on challenge requirements
    const shuffledQuestions = [...allQuestions].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffledQuestions.slice(0, challenge.questionCount);

    set({
      currentChallenge: challenge,
      isActive: true,
      questions: selectedQuestions,
      currentQuestionIndex: 0,
      answers: [],
      timeRemaining: challenge.timeLimit,
      streak: 0,
      results: null,
      isGuestMode: isGuest
    });
  },

  answerQuestion: (answerIndex: number) => {
    const { questions, currentQuestionIndex, answers, streak } = get();
    const currentQuestion = questions[currentQuestionIndex];
    const selectedAnswer = currentQuestion.options[answerIndex];
    const isCorrect = selectedAnswer === currentQuestion.answer;
    
    const newAnswers = [...answers, {
      questionIndex: currentQuestionIndex,
      selectedAnswer: answerIndex,
      isCorrect,
      timeSpent: 0 // Will be calculated by timer
    }];

    const newStreak = isCorrect ? streak + 1 : 0;

    set({
      answers: newAnswers,
      streak: newStreak,
      currentQuestionIndex: currentQuestionIndex + 1
    });
  },

  updateTimer: () => {
    const { timeRemaining, isActive } = get();
    if (!isActive || timeRemaining <= 0) return;

    const newTime = timeRemaining - 1;
    set({ timeRemaining: newTime });

    // End challenge when time runs out
    if (newTime <= 0) {
      get().endChallenge();
    }
  },

  endChallenge: () => {
    const { 
      currentChallenge, 
      questions, 
      answers, 
      timeRemaining, 
      personalBests,
      isGuestMode 
    } = get();
    
    if (!currentChallenge) return;

    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const timeSpent = currentChallenge.timeLimit - timeRemaining;
    
    const score = calculateScore(
      correctAnswers,
      questions.length,
      timeSpent,
      currentChallenge.timeLimit,
      currentChallenge.scoreMultiplier
    );

    const grade = getGrade(score);
    
    const result: ChallengeResult = {
      challengeId: currentChallenge.id,
      score,
      grade,
      correctAnswers,
      totalQuestions: questions.length,
      timeSpent,
      accuracy: Math.round((correctAnswers / questions.length) * 100),
      completedAt: new Date().toISOString()
    };

    // Update personal best only if not in guest mode
    const currentBest = personalBests[currentChallenge.id];
    const newPersonalBests = isGuestMode ? personalBests : {
      ...personalBests,
      [currentChallenge.id]: !currentBest || score > currentBest.score ? result : currentBest
    };

    set({
      isActive: false,
      results: result,
      personalBests: newPersonalBests
    });
  },

  resetChallenge: () => {
    set({
      currentChallenge: null,
      isActive: false,
      questions: [],
      currentQuestionIndex: 0,
      answers: [],
      timeRemaining: 0,
      streak: 0,
      results: null,
      isGuestMode: false
    });
  },

  getPersonalBest: (challengeId: string) => {
    return get().personalBests[challengeId] || null;
  }
}), {
  name: 'timed-challenge-storage',
  partialize: (state) => ({
    personalBests: state.personalBests,
    results: state.results
  })
}));
