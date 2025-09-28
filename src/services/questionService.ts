import type { Question } from '../types';
import { getAllQuestions, getQuestionsByTopic as getFirebaseQuestionsByTopic, getAvailableTopics as getFirebaseAvailableTopics } from '../firebase/questions';
import { getQuestionsByTopic as getStaticQuestionsByTopic, getUniqueTopics } from '../data/questions';

/**
 * Question service that handles both static and Firebase question loading
 */
export class QuestionService {
  private static useFirebase: boolean = false;
  private static cachedQuestions: Question[] = [];
  private static cachedTopics: string[] = [];
  private static lastCacheUpdate: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Enable Firebase mode for question loading
   */
  static enableFirebaseMode() {
    this.useFirebase = true;
    this.clearCache();
  }

  /**
   * Disable Firebase mode (use static questions)
   */
  static disableFirebaseMode() {
    this.useFirebase = false;
    this.clearCache();
  }

  /**
   * Check if Firebase mode is enabled
   */
  static isFirebaseModeEnabled(): boolean {
    return this.useFirebase;
  }

  /**
   * Clear cached data
   */
  static clearCache() {
    this.cachedQuestions = [];
    this.cachedTopics = [];
    this.lastCacheUpdate = 0;
  }

  /**
   * Check if cache is still valid
   */
  private static isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.CACHE_DURATION;
  }

  /**
   * Get all available questions
   */
  static async getAllQuestions(): Promise<Question[]> {
    try {
      if (this.useFirebase) {
        // Check cache first for Firebase questions
        if (this.cachedQuestions.length > 0 && this.isCacheValid()) {
          return this.cachedQuestions;
        }

        const questions = await getAllQuestions();
        // Also include curated/static Islam 101 when using Firebase
        let extras: Question[] = [];
        try {
          const mod = await import('../data/islam101');
          extras = mod.islam101Questions || [];
        } catch {
          extras = [];
        }

        // Merge + de-duplicate by question text + answer
        const mergedMap = new Map<string, Question>();
        for (const q of [...questions, ...extras]) {
          const key = `${q.question}__${q.answer}`.toLowerCase();
          if (!mergedMap.has(key)) mergedMap.set(key, q);
        }
        const merged = Array.from(mergedMap.values());
        
        // Cache the results
        this.cachedQuestions = merged;
        this.lastCacheUpdate = Date.now();
        
        return merged;
      } else {
        // Return static questions (imported synchronously)
        const { allQuestions } = await import('../data/questions');
        return allQuestions;
      }
    } catch (error) {
      // Check if it's a permissions error
      if (error && typeof error === 'object' && 'code' in error && error.code === 'permission-denied') {
        console.warn('📁 Firebase permissions denied, using static questions');
      } else {
        console.error('Error loading questions, falling back to static:', error);
      }
      // Fallback to static questions if Firebase fails
      const { allQuestions } = await import('../data/questions');
      return allQuestions;
    }
  }

  /**
   * Get questions filtered by topic
   */
  static async getQuestionsByTopic(topic: string): Promise<Question[]> {
    try {
      if (this.useFirebase) {
        if (topic === 'All Topics') {
          return await this.getAllQuestions();
        }
        const fb = await getFirebaseQuestionsByTopic(topic);
        let extras: Question[] = [];
        // Always include curated Islam 101 set when that topic is selected
        if (topic === 'Islam 101') {
          try {
            const mod = await import('../data/islam101');
            extras = (mod.islam101Questions || []).filter(q => q.topic === 'Islam 101');
          } catch {
            extras = [];
          }
        }
        let combined = [...fb, ...extras];
        if (combined.length === 0) {
          // Fallback to static dataset if still empty
          combined = getStaticQuestionsByTopic(topic);
        }
        // De-duplicate
        const map = new Map<string, Question>();
        for (const q of combined) {
          const key = `${q.question}__${q.answer}`.toLowerCase();
          if (!map.has(key)) map.set(key, q);
        }
        return Array.from(map.values());
      } else {
        return getStaticQuestionsByTopic(topic);
      }
    } catch (error) {
      console.error('Error loading questions by topic, falling back to static:', error);
      // Fallback to static questions
      return getStaticQuestionsByTopic(topic);
    }
  }

  /**
   * Get all available topics
   */
  static async getAvailableTopics(): Promise<string[]> {
    try {
      if (this.useFirebase) {
        // Check cache first
        if (this.cachedTopics.length > 0 && this.isCacheValid()) {
          return this.cachedTopics;
        }

        const topics = await getFirebaseAvailableTopics();
        // Always include curated categories that may exist in static data
        const curated = ['Islam 101'];
        const set = new Set<string>(['All Topics', ...topics, ...curated]);
        const allTopics = Array.from(set);
        
        // Cache the results
        this.cachedTopics = allTopics;
        this.lastCacheUpdate = Date.now();
        
        return allTopics;
      } else {
        return getUniqueTopics();
      }
    } catch (error) {
      console.error('Error loading topics, falling back to static:', error);
      // Fallback to static topics
      return getUniqueTopics();
    }
  }

  /**
   * Initialize the service based on available questions
   * This will check if Firebase has questions and automatically switch modes
   */
  static async initialize(): Promise<void> {
    try {
      // Try to load from Firebase
      const firebaseQuestions = await getAllQuestions();
      
      if (firebaseQuestions.length > 0) {
        console.log('🔥 Firebase questions found, enabling Firebase mode');
        this.enableFirebaseMode();
      } else {
        console.log('📁 No Firebase questions found, using static questions');
        this.disableFirebaseMode();
      }
    } catch {
      console.log('📁 Firebase unavailable, using static questions');
      this.disableFirebaseMode();
    }
  }

  /**
   * Force refresh of cached data
   */
  static async refresh(): Promise<void> {
    this.clearCache();
    if (this.useFirebase) {
      await this.getAllQuestions(); // This will refresh the cache
      await this.getAvailableTopics(); // This will refresh the topics cache
    }
  }
}

// Legacy exports for backward compatibility
export const getQuestionsByTopicLegacy = (topic: string): Promise<Question[]> => 
  QuestionService.getQuestionsByTopic(topic);

export const getAvailableTopicsLegacy = (): Promise<string[]> => 
  QuestionService.getAvailableTopics();
