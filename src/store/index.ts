import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Question, QuizState, User } from '../types';
import { QuestionService } from '../services/questionService';

interface QuizStore extends QuizState {
  // Guest mode flag
  isGuestMode: boolean;
  // Practice mode flag (e.g., retry incorrect only)
  isPracticeMode: boolean;
  
  // Loading states
  isLoadingQuestions: boolean;
  
  // Actions
  startQuiz: (topic: string, isGuest?: boolean) => Promise<void>;
  selectAnswer: (questionIndex: number, selectedAnswer: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  resetQuiz: () => void;
  completeQuiz: () => void;
  initializeQuestions: () => Promise<void>;
  refreshQuestions: () => Promise<void>;
  // Review / retry
  startRetryIncorrect: () => void;
  startNewQuizSameTopic: () => Promise<void>;
  startRetryQuizSameSet: () => void;
  
  // Getters
  getCurrentQuestion: () => Question | null;
  getProgress: () => number;
  getAvailableTopics: () => Promise<string[]>;
  getIncorrectQuestionIndexes: () => number[];
  getResults: () => { total: number; correct: number; incorrect: number[] };
}

const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const useQuizStore = create<QuizStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        filteredQuestions: [],
        currentQuestion: 0,
        answeredQuestions: {},
        score: 0,
        isQuizStarted: false,
        isQuizCompleted: false,
        selectedTopic: 'All Topics',
        isGuestMode: false,
        isPracticeMode: false,
        isLoadingQuestions: false,

        // Initialize question service
        initializeQuestions: async () => {
          set({ isLoadingQuestions: true });
          try {
            await QuestionService.initialize();
          } catch (error) {
            console.error('Error initializing questions:', error);
          } finally {
            set({ isLoadingQuestions: false });
          }
        },

        // Refresh questions cache
        refreshQuestions: async () => {
          set({ isLoadingQuestions: true });
          try {
            await QuestionService.refresh();
          } catch (error) {
            console.error('Error refreshing questions:', error);
          } finally {
            set({ isLoadingQuestions: false });
          }
        },

        // Actions
        startQuiz: async (topic: string, isGuest = false) => {
          set({ isLoadingQuestions: true });
          try {
            const questions = await QuestionService.getQuestionsByTopic(topic);
            const shuffledQuestions = shuffleArray(questions); // Use all available questions, no limit
            
            set({
              filteredQuestions: shuffledQuestions,
              selectedTopic: topic,
              currentQuestion: 0,
              answeredQuestions: {},
              score: 0,
              isQuizStarted: true,
              isQuizCompleted: false,
              isGuestMode: isGuest,
              isPracticeMode: false,
            });
          } catch (error) {
            console.error('Error starting quiz:', error);
            // Fallback to empty questions array
            set({
              filteredQuestions: [],
              selectedTopic: topic,
              currentQuestion: 0,
              answeredQuestions: {},
              score: 0,
              isQuizStarted: false,
              isQuizCompleted: false,
              isGuestMode: isGuest,
              isPracticeMode: false,
            });
          } finally {
            set({ isLoadingQuestions: false });
          }
        },

        selectAnswer: (questionIndex: number, selectedAnswer: string) => {
          const state = get();
          const question = state.filteredQuestions[questionIndex];
          const isCorrect = selectedAnswer === question.answer;
          
          const newAnsweredQuestions = {
            ...state.answeredQuestions,
            [questionIndex]: {
              selected: selectedAnswer,
              correct: isCorrect,
            },
          };

          const newScore = Object.values(newAnsweredQuestions).filter(
            (answer) => answer.correct
          ).length;

          set({
            answeredQuestions: newAnsweredQuestions,
            score: newScore,
          });
        },

        nextQuestion: () => {
          const state = get();
          if (state.currentQuestion < state.filteredQuestions.length - 1) {
            set({ currentQuestion: state.currentQuestion + 1 });
          }
        },

        previousQuestion: () => {
          const state = get();
          if (state.currentQuestion > 0) {
            set({ currentQuestion: state.currentQuestion - 1 });
          }
        },

        resetQuiz: () => {
          set({
            filteredQuestions: [],
            currentQuestion: 0,
            answeredQuestions: {},
            score: 0,
            isQuizStarted: false,
            isQuizCompleted: false,
            selectedTopic: 'All Topics',
            isGuestMode: false,
            isPracticeMode: false,
          });
        },

        completeQuiz: () => {
          set({ isQuizCompleted: true });
        },

        // Getters
        getCurrentQuestion: () => {
          const state = get();
          return state.filteredQuestions[state.currentQuestion] || null;
        },

        getProgress: () => {
          const state = get();
          if (state.filteredQuestions.length === 0) return 0;
          return ((state.currentQuestion + 1) / state.filteredQuestions.length) * 100;
        },

        getIncorrectQuestionIndexes: () => {
          const state = get();
          const idxs: number[] = [];
          for (let i = 0; i < state.filteredQuestions.length; i++) {
            const ans = state.answeredQuestions[i];
            if (ans && !ans.correct) idxs.push(i);
          }
          return idxs;
        },

        getResults: () => {
          const state = get();
          const incorrect = get().getIncorrectQuestionIndexes();
          const correct = Object.values(state.answeredQuestions).filter(a => a.correct).length;
          return {
            total: state.filteredQuestions.length,
            correct,
            incorrect,
          };
        },

        getAvailableTopics: async () => {
          try {
            return await QuestionService.getAvailableTopics();
          } catch (error) {
            console.error('Error getting available topics:', error);
            return ['All Topics']; // Fallback
          }
        },

        // Review / retry helpers
        startRetryIncorrect: () => {
          const state = get();
          const incorrectIdx = get().getIncorrectQuestionIndexes();
          if (incorrectIdx.length === 0) {
            // Nothing to retry; keep results as is
            return;
          }
          const questions = incorrectIdx
            .map(i => state.filteredQuestions[i])
            .filter(Boolean);
          const baseTopic = state.selectedTopic.replace(/ \(Retry\)$/i, '');
          set({
            filteredQuestions: questions,
            currentQuestion: 0,
            answeredQuestions: {},
            score: 0,
            isQuizStarted: true,
            isQuizCompleted: false,
            selectedTopic: `${baseTopic} (Retry)`,
            isPracticeMode: true,
          });
        },

        startNewQuizSameTopic: async () => {
          const state = get();
          const baseTopic = state.selectedTopic.replace(/ \(Retry\)$/i, '');
          await get().startQuiz(baseTopic, state.isGuestMode);
        },

        // Retry the same set of questions (order remixed), practice mode
        startRetryQuizSameSet: () => {
          const state = get();
          if (!state.filteredQuestions || state.filteredQuestions.length === 0) return;
          const remixed = shuffleArray(state.filteredQuestions);
          const baseTopic = state.selectedTopic.replace(/ \(Retry\)$/i, '');
          set({
            filteredQuestions: remixed,
            currentQuestion: 0,
            answeredQuestions: {},
            score: 0,
            isQuizStarted: true,
            isQuizCompleted: false,
            selectedTopic: `${baseTopic} (Retry)`,
            isPracticeMode: true,
          });
        },
      }),
      {
        name: 'islamic-quiz-storage',
        partialize: (state) => ({
          score: state.score,
          selectedTopic: state.selectedTopic,
        }),
      }
    )
  )
);

// User store for authentication and profile management
interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: User) => void;
  clearUser: () => void;
  updateScore: (topic: string, score: number) => void;
}

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,

        setUser: (user: User) => {
          set({ user, isAuthenticated: true });
        },

        clearUser: () => {
          set({ user: null, isAuthenticated: false });
        },

        updateScore: (topic: string, score: number) => {
          const state = get();
          if (!state.user) return;

          const currentHighScore = state.user.highScores[topic] || 0;
          if (score > currentHighScore) {
            set({
              user: {
                ...state.user,
                highScores: {
                  ...state.user.highScores,
                  [topic]: score,
                },
                totalScore: state.user.totalScore + (score - currentHighScore),
                gamesPlayed: state.user.gamesPlayed + 1,
              },
            });
          }
        },
      }),
      {
        name: 'islamic-quiz-user',
        partialize: (state) => ({
          ...state,
          isGuestMode: false, // Never persist guest mode
        }),
      }
    )
  )
);
