export interface Question {
  id?: string;
  question: string;
  options: string[];
  answer: string;
  topic: string;
  explanation: string;
}

export interface QuizState {
  filteredQuestions: Question[];
  currentQuestion: number;
  answeredQuestions: Record<number, { selected: string; correct: boolean }>;
  score: number;
  isQuizStarted: boolean;
  isQuizCompleted: boolean;
  selectedTopic: string;
  isGuestMode: boolean;
  isLoadingQuestions?: boolean;
  timerInterval?: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  totalScore: number;
  gamesPlayed: number;
  highScores: Record<string, number>; // topic -> high score
  rank?: number;
}

export interface Competition {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  questions: Question[];
  participants: User[];
  prizes: string[];
  isActive: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  completionTime: number;
  rank: number;
}

export interface TimedChallenge {
  id: string;
  name: string;
  description: string;
  timeLimit: number; // in seconds
  questionCount: number;
  scoreMultiplier: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  icon: string;
}

export interface ChallengeAnswer {
  questionIndex: number;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
}

export interface ChallengeResult {
  challengeId: string;
  score: number;
  grade: string;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  accuracy: number;
  completedAt: string;
}

export interface TimedChallengeState {
  currentChallenge: TimedChallenge | null;
  isActive: boolean;
  questions: Question[];
  currentQuestionIndex: number;
  answers: ChallengeAnswer[];
  timeRemaining: number;
  streak: number;
  results: ChallengeResult | null;
  personalBests: Record<string, ChallengeResult>;
  isGuestMode: boolean;
  
  // Actions
  startChallenge: (challengeId: string, isGuest?: boolean) => void;
  answerQuestion: (answerIndex: number) => void;
  updateTimer: () => void;
  endChallenge: () => void;
  resetChallenge: () => void;
  getPersonalBest: (challengeId: string) => ChallengeResult | null;
}