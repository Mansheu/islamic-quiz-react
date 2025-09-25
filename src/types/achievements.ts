export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirement: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserAchievements {
  userId: string;
  achievements: Achievement[];
  totalUnlocked: number;
  currentStreak: number;
  longestStreak: number;
  lastQuizDate?: Date;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  perfectScores: number;
  updatedAt: Date;
}

export interface DailyStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date;
  streakHistory: Date[];
}

export type AchievementCategory = 
  | 'questions' 
  | 'streaks' 
  | 'accuracy' 
  | 'topics' 
  | 'speed' 
  | 'special';

// Achievement definitions
export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'isUnlocked' | 'unlockedAt' | 'progress'>[] = [
  // Questions Answered Achievements
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Answer your first question',
    icon: '🌱',
    category: 'questions',
    requirement: 1,
    rarity: 'common'
  },
  {
    id: 'curious-mind',
    name: 'Curious Mind',
    description: 'Answer 25 questions',
    icon: '🤔',
    category: 'questions',
    requirement: 25,
    rarity: 'common'
  },
  {
    id: 'knowledge-seeker',
    name: 'Knowledge Seeker',
    description: 'Answer 100 questions',
    icon: '📚',
    category: 'questions',
    requirement: 100,
    rarity: 'rare'
  },
  {
    id: 'scholar',
    name: 'Scholar',
    description: 'Answer 500 questions',
    icon: '🎓',
    category: 'questions',
    requirement: 500,
    rarity: 'epic'
  },
  {
    id: 'master-learner',
    name: 'Master Learner',
    description: 'Answer 1000 questions',
    icon: '👑',
    category: 'questions',
    requirement: 1000,
    rarity: 'legendary'
  },
  
  // Daily Streak Achievements
  {
    id: 'daily-dedication',
    name: 'Daily Dedication',
    description: 'Maintain a 3-day study streak',
    icon: '🔥',
    category: 'streaks',
    requirement: 3,
    rarity: 'common'
  },
  {
    id: 'weekly-warrior',
    name: 'Weekly Warrior',
    description: 'Maintain a 7-day study streak',
    icon: '⚡',
    category: 'streaks',
    requirement: 7,
    rarity: 'rare'
  },
  {
    id: 'monthly-master',
    name: 'Monthly Master',
    description: 'Maintain a 30-day study streak',
    icon: '🌟',
    category: 'streaks',
    requirement: 30,
    rarity: 'epic'
  },
  {
    id: 'consistency-champion',
    name: 'Consistency Champion',
    description: 'Maintain a 100-day study streak',
    icon: '💎',
    category: 'streaks',
    requirement: 100,
    rarity: 'legendary'
  },
  
  // Accuracy Achievements
  {
    id: 'first-perfect',
    name: 'Perfect Start',
    description: 'Get your first perfect score',
    icon: '✨',
    category: 'accuracy',
    requirement: 1,
    rarity: 'common'
  },
  {
    id: 'accuracy-expert',
    name: 'Accuracy Expert',
    description: 'Achieve 5 perfect scores',
    icon: '🎯',
    category: 'accuracy',
    requirement: 5,
    rarity: 'rare'
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Achieve 20 perfect scores',
    icon: '💫',
    category: 'accuracy',
    requirement: 20,
    rarity: 'epic'
  },
  
  // Topic Mastery Achievements
  {
    id: 'quran-explorer',
    name: 'Quran Explorer',
    description: 'Complete 10 Quran-related quizzes',
    icon: '📖',
    category: 'topics',
    requirement: 10,
    rarity: 'rare'
  },
  {
    id: 'hadith-student',
    name: 'Hadith Student',
    description: 'Complete 10 Hadith-related quizzes',
    icon: '📜',
    category: 'topics',
    requirement: 10,
    rarity: 'rare'
  },
  {
    id: 'prophet-follower',
    name: 'Prophet Follower',
    description: 'Complete 10 Prophet Muhammad (PBUH) quizzes',
    icon: '🕌',
    category: 'topics',
    requirement: 10,
    rarity: 'rare'
  },
  
  // Speed Achievements
  {
    id: 'quick-thinker',
    name: 'Quick Thinker',
    description: 'Complete a timed quiz with perfect score',
    icon: '⚡',
    category: 'speed',
    requirement: 1,
    rarity: 'rare'
  },
  {
    id: 'lightning-fast',
    name: 'Lightning Fast',
    description: 'Complete 5 timed quizzes with perfect scores',
    icon: '⚡',
    category: 'speed',
    requirement: 5,
    rarity: 'epic'
  },
  
  // Special Achievements
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Complete a quiz before 7 AM',
    icon: '🌅',
    category: 'special',
    requirement: 1,
    rarity: 'rare'
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Complete a quiz after 10 PM',
    icon: '🦉',
    category: 'special',
    requirement: 1,
    rarity: 'rare'
  },
  {
    id: 'weekend-learner',
    name: 'Weekend Learner',
    description: 'Study on both Saturday and Sunday',
    icon: '📅',
    category: 'special',
    requirement: 1,
    rarity: 'common'
  }
];

export const RARITY_COLORS = {
  common: '#68BA7F',
  rare: '#4A90E2',
  epic: '#9B59B6',
  legendary: '#F39C12'
};

export const CATEGORY_ICONS = {
  questions: '📚',
  streaks: '🔥',
  accuracy: '🎯',
  topics: '📖',
  speed: '⚡',
  special: '✨'
};