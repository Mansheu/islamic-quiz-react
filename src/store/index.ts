import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Question, QuizState, User } from '../types';
import { getQuestionsByTopic, getUniqueTopics } from '../data/questions';

interface QuizStore extends QuizState {
  // Guest mode flag
  isGuestMode: boolean;
  
  // Actions
  startQuiz: (topic: string, isGuest?: boolean) => void;
  selectAnswer: (questionIndex: number, selectedAnswer: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  resetQuiz: () => void;
  completeQuiz: () => void;
  
  // Getters
  getCurrentQuestion: () => Question | null;
  getProgress: () => number;
  getAvailableTopics: () => string[];
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

        // Actions
        startQuiz: (topic: string, isGuest = false) => {
          const questions = getQuestionsByTopic(topic);
          const shuffledQuestions = shuffleArray(questions).slice(0, 10); // Limit to 10 questions
          
          set({
            filteredQuestions: shuffledQuestions,
            selectedTopic: topic,
            currentQuestion: 0,
            answeredQuestions: {},
            score: 0,
            isQuizStarted: true,
            isQuizCompleted: false,
            isGuestMode: isGuest,
          });
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

        getAvailableTopics: () => {
          return getUniqueTopics();
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