import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { allQuestions } from '../data/questions';
import {
  saveTimedChallengeResult,
  getTimedChallengeProfile,
  migrateLocalStorageToFirebase
} from '../firebase/timedChallenges';
import { updateUserProgress, updateDailyStreak } from '../firebase/achievements';
import { auth } from '../firebase/config';
import type { TimedChallenge, ChallengeResult, TimedChallengeState, Question } from '../types';

// Challenge configurations
export const timedChallenges: TimedChallenge[] = [
  {
    id: 'speed-5',
    name: 'Speed Run',
    description: 'Quick 5-question challenge to test your reflexes',
    timeLimit: 60,
    questionCount: 5,
    scoreMultiplier: 1.2,
    difficulty: 'easy',
    topic: 'Mixed',
    icon: ''
  },
  {
    id: 'lightning-10',
    name: 'Lightning Round',
    description: 'Fast-paced 10 questions in 2 minutes',
    timeLimit: 120,
    questionCount: 10,
    scoreMultiplier: 1.5,
    difficulty: 'medium',
    topic: 'Mixed',
    icon: ''
  },
  {
    id: 'blitz-15',
    name: 'Knowledge Blitz',
    description: 'Ultimate 15-question challenge in 3 minutes',
    timeLimit: 180,
    questionCount: 15,
    scoreMultiplier: 2.0,
    difficulty: 'hard',
    topic: 'Mixed',
    icon: ''
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
  const speedBonus = timeBonus * 0.5;
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
    case 'S': return '#FFD700';
    case 'A': return '#00E676';
    case 'B': return '#00BCD4';
    case 'C': return '#FF9800';
    case 'D': return '#F44336';
    default: return '#9E9E9E';
  }
};

// Zustand store with persistence
export const useTimedChallengeStore = create<TimedChallengeState>()(
  persist(
    (set, get) => ({
      // State
      currentChallenge: null,
      isActive: false,
      questions: [] as Question[],
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
          timeSpent: 0
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

        const currentBest = personalBests[currentChallenge.id];
        const gradeValue = (g: string): number => {
          const gradeOrder: Record<string, number> = { S: 5, A: 4, B: 3, C: 2, D: 1 };
          return gradeOrder[g] ?? 0;
        };

        const isNewBest = !currentBest ||
          score > currentBest.score ||
          (score === currentBest.score && gradeValue(grade) > gradeValue(currentBest.grade));

        const newPersonalBests = isGuestMode ? personalBests : {
          ...personalBests,
          [currentChallenge.id]: isNewBest ? result : currentBest
        };

        if (!isGuestMode && auth.currentUser) {
          const isPerfectScore = correctAnswers === questions.length;
          Promise.all([
            updateUserProgress(auth.currentUser.uid, {
              questionsAnswered: questions.length,
              correctAnswers,
              isPerfectScore,
              isTimedQuiz: true,
              isTimedPerfect: isPerfectScore
            }),
            updateDailyStreak(auth.currentUser.uid),
            saveTimedChallengeResult(auth.currentUser.uid, result, isNewBest)
          ]).catch(() => {
            // Ignore errors here; local state will still update
          });
        }

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
      },

      // Debug and utility functions
      debugPersonalBests: () => {
        const { personalBests } = get();
        return personalBests;
      },

      refreshPersonalBests: () => {
        const { personalBests } = get();
        const refreshedBests = { ...personalBests };
        Object.keys(refreshedBests).forEach(challengeId => {
          const best = refreshedBests[challengeId];
          const recalculatedGrade = getGrade(best.score);
          if (recalculatedGrade !== best.grade) {
            refreshedBests[challengeId] = { ...best, grade: recalculatedGrade };
          }
        });
        set({ personalBests: refreshedBests });
        return refreshedBests;
      },

      clearPersonalBests: () => {
        set({ personalBests: {} });
      },

      loadPersonalBestsFromFirebase: async () => {
        if (!auth.currentUser) {
          return;
        }
        try {
          const profile = await getTimedChallengeProfile(auth.currentUser.uid);
          if (profile && profile.personalBests) {
            set({ personalBests: profile.personalBests });
          }
        } catch (e) { void e; }
      },

      // Automatic sync when user signs in (server is source of truth)
      syncWithFirebase: async () => {
        if (!auth.currentUser) {
          return;
        }

        const { personalBests } = get();
        try {
          const profile = await getTimedChallengeProfile(auth.currentUser.uid);
          if (profile && profile.personalBests && Object.keys(profile.personalBests).length > 0) {
            const firebaseData = profile.personalBests;
            const mergedData: Record<string, ChallengeResult> = { ...firebaseData };
            let hasLocalImprovements = false;
            Object.entries(personalBests).forEach(([challengeId, localResult]) => {
              const firebaseResult = firebaseData[challengeId];
              if (!firebaseResult || localResult.score > firebaseResult.score) {
                mergedData[challengeId] = localResult;
                hasLocalImprovements = true;
              }
            });
            set({ personalBests: mergedData });
            if (hasLocalImprovements) {
              for (const [challengeId, result] of Object.entries(personalBests)) {
                const firebaseResult = firebaseData[challengeId];
                if (!firebaseResult || result.score > firebaseResult.score) {
                  await saveTimedChallengeResult(auth.currentUser.uid, result, true);
                }
              }
            }
          } else {
            // Server has no data (e.g., after admin reset) -> clear local
            set({ personalBests: {}, results: null });
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.removeItem('timed-challenge-storage');
              }
            } catch (e) { void e; }
          }
        } catch {
          // Ignore errors
        }
      },

      migrateToFirebase: async () => {
        if (!auth.currentUser) {
          return false;
        }
        const { personalBests } = get();
        if (Object.keys(personalBests).length === 0) {
          return false;
        }
        try {
          await migrateLocalStorageToFirebase(auth.currentUser.uid, personalBests);
          return true;
        } catch {
          return false;
        }
      }
    }),
    {
      name: 'timed-challenge-storage',
      partialize: (state) => ({
        personalBests: state.personalBests,
        results: state.results
      })
    }
  )
);
