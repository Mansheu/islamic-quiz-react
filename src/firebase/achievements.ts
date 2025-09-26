import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { firestore } from './config';
import type { 
  Achievement, 
  UserAchievements, 
  DailyStreak,
  AchievementCategory 
} from '../types/achievements';
import { ACHIEVEMENT_DEFINITIONS } from '../types/achievements';

const ACHIEVEMENTS_COLLECTION = 'achievements';
const STREAKS_COLLECTION = 'streaks';

// Initialize user achievements with all available achievements
export const initializeUserAchievements = async (userId: string): Promise<UserAchievements> => {
  const achievements: Achievement[] = ACHIEVEMENT_DEFINITIONS.map(def => ({
    ...def,
    isUnlocked: false,
    progress: 0
  }));

  const userAchievements: UserAchievements = {
    userId,
    achievements,
    totalUnlocked: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalQuestionsAnswered: 0,
    totalCorrectAnswers: 0,
    perfectScores: 0,
    updatedAt: new Date()
  };

  await setDoc(doc(firestore, ACHIEVEMENTS_COLLECTION, userId), {
    ...userAchievements,
    updatedAt: Timestamp.fromDate(userAchievements.updatedAt)
  });

  return userAchievements;
};

// Get user achievements
export const getUserAchievements = async (userId: string): Promise<UserAchievements | null> => {
  try {
    const docRef = doc(firestore, ACHIEVEMENTS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Convert Firestore data to UserAchievements with proper date conversions
      const achievements: Achievement[] = data.achievements.map((achievement: Achievement & { unlockedAt?: Timestamp | Date }) => ({
        ...achievement,
        unlockedAt: achievement.unlockedAt && typeof achievement.unlockedAt === 'object' && 'toDate' in achievement.unlockedAt
          ? (achievement.unlockedAt as Timestamp).toDate() 
          : achievement.unlockedAt as Date
      }));
      
      return {
        ...data,
        achievements,
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastQuizDate: data.lastQuizDate?.toDate()
      } as UserAchievements;
    } else {
      // Initialize achievements for new user
      return await initializeUserAchievements(userId);
    }
  } catch (error) {
    console.error('Error getting user achievements:', error);
    return null;
  }
};

// Update user progress and check for new achievements
export const updateUserProgress = async (
  userId: string,
  progressData: {
    questionsAnswered?: number;
    correctAnswers?: number;
    isPerfectScore?: boolean;
    quizTopic?: string;
    isTimedQuiz?: boolean;
    isTimedPerfect?: boolean;
  }
): Promise<Achievement[]> => {
  const userAchievements = await getUserAchievements(userId);
  if (!userAchievements) return [];

  const newlyUnlocked: Achievement[] = [];
  const batch = writeBatch(firestore);

  // Update basic stats
  if (progressData.questionsAnswered) {
    userAchievements.totalQuestionsAnswered += progressData.questionsAnswered;
  }
  if (progressData.correctAnswers) {
    userAchievements.totalCorrectAnswers += progressData.correctAnswers;
  }
  if (progressData.isPerfectScore) {
    userAchievements.perfectScores += 1;
  }

  // Update last quiz date for streak calculation
  userAchievements.lastQuizDate = new Date();

  // Check each achievement for unlock conditions
  userAchievements.achievements = userAchievements.achievements.map(achievement => {
    if (achievement.isUnlocked) return achievement;

    let shouldUnlock = false;
    let newProgress = achievement.progress || 0;

    switch (achievement.id) {
      // Questions achievements
      case 'first-steps':
        newProgress = userAchievements.totalQuestionsAnswered;
        shouldUnlock = userAchievements.totalQuestionsAnswered >= 1;
        break;
      case 'curious-mind':
        newProgress = userAchievements.totalQuestionsAnswered;
        shouldUnlock = userAchievements.totalQuestionsAnswered >= 25;
        break;
      case 'knowledge-seeker':
        newProgress = userAchievements.totalQuestionsAnswered;
        shouldUnlock = userAchievements.totalQuestionsAnswered >= 100;
        break;
      case 'scholar':
        newProgress = userAchievements.totalQuestionsAnswered;
        shouldUnlock = userAchievements.totalQuestionsAnswered >= 500;
        break;
      case 'master-learner':
        newProgress = userAchievements.totalQuestionsAnswered;
        shouldUnlock = userAchievements.totalQuestionsAnswered >= 1000;
        break;

      // Accuracy achievements
      case 'first-perfect':
        newProgress = userAchievements.perfectScores;
        shouldUnlock = userAchievements.perfectScores >= 1;
        break;
      case 'accuracy-expert':
        newProgress = userAchievements.perfectScores;
        shouldUnlock = userAchievements.perfectScores >= 5;
        break;
      case 'perfectionist':
        newProgress = userAchievements.perfectScores;
        shouldUnlock = userAchievements.perfectScores >= 20;
        break;

      // Speed achievements
      case 'quick-thinker':
        if (progressData.isTimedPerfect) {
          newProgress = 1;
          shouldUnlock = true;
        }
        break;
      case 'lightning-fast':
        if (progressData.isTimedPerfect) {
          newProgress = (achievement.progress || 0) + 1;
          shouldUnlock = newProgress >= 5;
        }
        break;

      // Special time-based achievements
      case 'early-bird':
        if (isEarlyMorning()) {
          newProgress = 1;
          shouldUnlock = true;
        }
        break;
      case 'night-owl':
        if (isLateNight()) {
          newProgress = 1;
          shouldUnlock = true;
        }
        break;
      case 'weekend-learner':
        if (isWeekend()) {
          newProgress = 1;
          shouldUnlock = true;
        }
        break;
    }

    if (shouldUnlock && !achievement.isUnlocked) {
      const unlockedAchievement: Achievement = {
        ...achievement,
        isUnlocked: true,
        unlockedAt: new Date(),
        progress: achievement.requirement
      };
      newlyUnlocked.push(unlockedAchievement);
      return unlockedAchievement;
    }

    return {
      ...achievement,
      progress: Math.min(newProgress, achievement.requirement)
    };
  });

  // Update total unlocked count
  userAchievements.totalUnlocked = userAchievements.achievements.filter(a => a.isUnlocked).length;
  userAchievements.updatedAt = new Date();

  // Save to Firebase
  const docRef = doc(firestore, ACHIEVEMENTS_COLLECTION, userId);
  batch.set(docRef, {
    ...userAchievements,
    updatedAt: Timestamp.fromDate(userAchievements.updatedAt),
    lastQuizDate: userAchievements.lastQuizDate ? Timestamp.fromDate(userAchievements.lastQuizDate) : null
  });

  await batch.commit();

  return newlyUnlocked;
};

// Daily streak functions
export const updateDailyStreak = async (userId: string): Promise<DailyStreak> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of day

  try {
    const docRef = doc(firestore, STREAKS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    let streak: DailyStreak;
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      streak = {
        ...data,
        lastActiveDate: data.lastActiveDate?.toDate() || new Date(),
        streakHistory: data.streakHistory?.map((date: Timestamp) => date.toDate()) || []
      } as DailyStreak;
    } else {
      // Initialize new streak
      streak = {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: new Date(0), // Very old date
        streakHistory: []
      };
    }

    const lastActiveDate = new Date(streak.lastActiveDate);
    lastActiveDate.setHours(0, 0, 0, 0);
    
    const timeDiff = today.getTime() - lastActiveDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Already studied today, no change needed
      return streak;
    } else if (daysDiff === 1) {
      // Consecutive day, increment streak
      streak.currentStreak += 1;
      streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
    } else {
      // Streak broken, reset
      streak.currentStreak = 1;
    }

    streak.lastActiveDate = today;
    streak.streakHistory.push(today);

    // Keep only last 365 days in history
    if (streak.streakHistory.length > 365) {
      streak.streakHistory = streak.streakHistory.slice(-365);
    }

    // Save to Firebase
    await setDoc(docRef, {
      ...streak,
      lastActiveDate: Timestamp.fromDate(streak.lastActiveDate),
      streakHistory: streak.streakHistory.map(date => Timestamp.fromDate(date))
    });

    // Update achievements with new streak data
    const userAchievements = await getUserAchievements(userId);
    if (userAchievements) {
      userAchievements.currentStreak = streak.currentStreak;
      userAchievements.longestStreak = streak.longestStreak;

      // Check streak achievements
      const newlyUnlocked: Achievement[] = [];
      userAchievements.achievements = userAchievements.achievements.map(achievement => {
        if (achievement.isUnlocked || achievement.category !== 'streaks') return achievement;

        let shouldUnlock = false;
        const newProgress = streak.currentStreak;

        switch (achievement.id) {
          case 'daily-dedication':
            shouldUnlock = streak.currentStreak >= 3;
            break;
          case 'weekly-warrior':
            shouldUnlock = streak.currentStreak >= 7;
            break;
          case 'monthly-master':
            shouldUnlock = streak.currentStreak >= 30;
            break;
          case 'consistency-champion':
            shouldUnlock = streak.currentStreak >= 100;
            break;
        }

        if (shouldUnlock) {
          const unlockedAchievement: Achievement = {
            ...achievement,
            isUnlocked: true,
            unlockedAt: new Date(),
            progress: achievement.requirement
          };
          newlyUnlocked.push(unlockedAchievement);
          return unlockedAchievement;
        }

        return {
          ...achievement,
          progress: Math.min(newProgress, achievement.requirement)
        };
      });

      // Update achievements in Firebase if new ones were unlocked OR if streak data changed
      if (newlyUnlocked.length > 0) {
        userAchievements.totalUnlocked = userAchievements.achievements.filter(a => a.isUnlocked).length;
      }
      
      // Always update the streak values and updatedAt timestamp
      userAchievements.updatedAt = new Date();

      const achievementsRef = doc(firestore, ACHIEVEMENTS_COLLECTION, userId);
      await updateDoc(achievementsRef, {
        ...userAchievements,
        updatedAt: Timestamp.fromDate(userAchievements.updatedAt)
      });
    }

    return streak;
  } catch (error) {
    console.error('Error updating daily streak:', error);
    throw error;
  }
};

// Get user's daily streak
export const getUserStreak = async (userId: string): Promise<DailyStreak | null> => {
  try {
    const docRef = doc(firestore, STREAKS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        lastActiveDate: data.lastActiveDate?.toDate() || new Date(),
        streakHistory: data.streakHistory?.map((date: Timestamp) => date.toDate()) || []
      } as DailyStreak;
    }
    return null;
  } catch (error) {
    console.error('Error getting user streak:', error);
    return null;
  }
};

// Real-time listener for user achievements
export const subscribeToUserAchievements = (
  userId: string, 
  callback: (achievements: UserAchievements | null) => void
) => {
  const docRef = doc(firestore, ACHIEVEMENTS_COLLECTION, userId);
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      const achievements: UserAchievements = {
        ...data,
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastQuizDate: data.lastQuizDate?.toDate()
      } as UserAchievements;
      callback(achievements);
    } else {
      callback(null);
    }
  });
};

// Get detailed daily streak data
export const getUserDailyStreak = async (userId: string): Promise<DailyStreak | null> => {
  try {
    const docRef = doc(firestore, STREAKS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        lastActiveDate: data.lastActiveDate?.toDate() || new Date(),
        streakHistory: data.streakHistory?.map((date: Timestamp) => date.toDate()) || []
      } as DailyStreak;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user daily streak:', error);
    return null;
  }
};

// Helper functions
const isEarlyMorning = (): boolean => {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 5 && hour < 7;
};

const isLateNight = (): boolean => {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 22 || hour < 2;
};

const isWeekend = (): boolean => {
  const now = new Date();
  const day = now.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

// Get achievement by category
export const getAchievementsByCategory = (
  achievements: Achievement[], 
  category: AchievementCategory
): Achievement[] => {
  return achievements.filter(achievement => achievement.category === category);
};

// Calculate overall progress percentage
export const calculateOverallProgress = (achievements: Achievement[]): number => {
  const total = achievements.length;
  const unlocked = achievements.filter(a => a.isUnlocked).length;
  return total > 0 ? Math.round((unlocked / total) * 100) : 0;
};