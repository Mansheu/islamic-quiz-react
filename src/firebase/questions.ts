import { getFirestoreInstance } from './config';
import type { Question } from '../types';
import type { Timestamp } from 'firebase/firestore';

export interface FirebaseQuestion extends Omit<Question, 'id'> {
  id?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  createdBy: string; // User ID of the admin who created it
  originalKey?: string; // stable key from original data (for sync dedupe)
  source?: 'static' | 'manual';
}
const QUESTIONS_COLLECTION = 'questions';
const TOMBSTONES_COLLECTION = 'question_tombstones';

/**
 * Get all questions from Firestore
 */
export const getAllQuestions = async (): Promise<Question[]> => {
  try {
    const { firestore } = await getFirestoreInstance();
    const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
    const questionsRef = collection(firestore, QUESTIONS_COLLECTION);
    const q = query(
      questionsRef,
      where('isActive', '==', true),
      orderBy('topic'),
      orderBy('createdAt')
    );

    const querySnapshot = await getDocs(q);
    const questions: Question[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirebaseQuestion;
      questions.push({
        id: doc.id,
        question: data.question,
        options: data.options,
        answer: data.answer,
        topic: data.topic,
        explanation: data.explanation
      });
    });
    
    return questions;
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw new Error('Failed to load questions');
  }
};

/**
 * Get questions filtered by topic
 */
export const getQuestionsByTopic = async (topic: string): Promise<Question[]> => {
  try {
    const { firestore } = await getFirestoreInstance();
    const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
    const questionsRef = collection(firestore, QUESTIONS_COLLECTION);
    const q = query(
      questionsRef,
      where('isActive', '==', true),
      where('topic', '==', topic),
      orderBy('createdAt')
    );

    const querySnapshot = await getDocs(q);
    const questions: Question[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirebaseQuestion;
      questions.push({
        id: doc.id,
        question: data.question,
        options: data.options,
        answer: data.answer,
        topic: data.topic,
        explanation: data.explanation
      });
    });
    
    return questions;
  } catch (error) {
    console.error('Error fetching questions by topic:', error);
    throw new Error('Failed to load questions for this topic');
  }
};

/**
 * Get all available topics
 */
export const getAvailableTopics = async (): Promise<string[]> => {
  try {
    const { firestore } = await getFirestoreInstance();
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const questionsRef = collection(firestore, QUESTIONS_COLLECTION);
    const q = query(
      questionsRef,
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const topicsSet = new Set<string>();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirebaseQuestion;
      topicsSet.add(data.topic);
    });
    
    return Array.from(topicsSet).sort();
  } catch (error) {
    console.error('Error fetching topics:', error);
    throw new Error('Failed to load topics');
  }
};

/**
 * Add a new question
 */
export const addQuestion = async (
  question: Omit<Question, 'id'>, 
  userId: string
): Promise<string> => {
  try {
    const { firestore } = await getFirestoreInstance();
    const { collection, addDoc, Timestamp } = await import('firebase/firestore');
    const questionsRef = collection(firestore, QUESTIONS_COLLECTION);
    const now = Timestamp.now();
    
    const originalKey = `${question.question}__${question.answer}`.toLowerCase();
    const questionData: Omit<FirebaseQuestion, 'id'> = {
      ...question,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      createdBy: userId,
      source: 'manual',
      originalKey
    };
    
  const docRef = await addDoc(questionsRef, questionData as import('firebase/firestore').DocumentData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding question:', error);
    throw new Error('Failed to add question');
  }
};

/**
 * Update an existing question
 */
export const updateQuestion = async (
  questionId: string, 
  updates: Partial<Omit<Question, 'id'>> & { isActive?: boolean; originalKey?: string; source?: 'static' | 'manual' }
): Promise<void> => {
  try {
    const { firestore } = await getFirestoreInstance();
    const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
    const questionRef = doc(firestore, QUESTIONS_COLLECTION, questionId);
    const now = Timestamp.now();

    await updateDoc(questionRef, {
      ...updates,
      updatedAt: now
    } as import('firebase/firestore').DocumentData);
  } catch (error) {
    console.error('Error updating question:', error);
    throw new Error('Failed to update question');
  }
};

/**
 * Delete a question (soft delete by marking as inactive)
 */
export const deleteQuestion = async (questionId: string): Promise<void> => {
  try {
    const { firestore } = await getFirestoreInstance();
    const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
    const questionRef = doc(firestore, QUESTIONS_COLLECTION, questionId);
    const now = Timestamp.now();

    await updateDoc(questionRef, {
      isActive: false,
      updatedAt: now
    } as import('firebase/firestore').DocumentData);
  } catch (error) {
    console.error('Error deleting question:', error);
    throw new Error('Failed to delete question');
  }
};

/**
 * Permanently delete a question (hard delete)
 */
export const permanentlyDeleteQuestion = async (questionId: string): Promise<void> => {
  try {
    const { firestore } = await getFirestoreInstance();
    const { doc, deleteDoc } = await import('firebase/firestore');
    const questionRef = doc(firestore, QUESTIONS_COLLECTION, questionId);
    await deleteDoc(questionRef);
  } catch (error) {
    console.error('Error permanently deleting question:', error);
    throw new Error('Failed to permanently delete question');
  }
};


/**
 * Fetch a single question by ID with admin fields
 */
export const getQuestionById = async (
  questionId: string
): Promise<(Question & {
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  originalKey?: string;
  source?: 'static' | 'manual';
}) | null> => {
  try {
    const { firestore } = await getFirestoreInstance();
    const { doc, getDoc } = await import('firebase/firestore');
    const ref = doc(firestore, QUESTIONS_COLLECTION, questionId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as FirebaseQuestion;
    return {
      id: snap.id,
      question: data.question,
      options: data.options,
      answer: data.answer,
      topic: data.topic,
      explanation: data.explanation,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      createdBy: data.createdBy,
      originalKey: data.originalKey,
      source: data.source
    };
  } catch (error) {
    console.error('Error fetching question by id:', error);
    throw new Error('Failed to fetch question');
  }
};

/**
 * Record a tombstone for a deleted static question so sync won't re-add it
 */
export const addDeletedStaticKey = async (originalKey: string, userId: string): Promise<void> => {
  try {
    const { firestore } = await getFirestoreInstance();
    const { collection, doc, setDoc, Timestamp } = await import('firebase/firestore');
    const col = collection(firestore, TOMBSTONES_COLLECTION);
    const ref = doc(col, originalKey);
    await setDoc(ref, { deletedAt: Timestamp.now(), userId });
  } catch (error) {
    console.error('Error adding deleted static key:', error);
  }
};

/**
 * Get set of tombstoned static keys
 */
export const getDeletedStaticKeys = async (): Promise<Set<string>> => {
  try {
    const { firestore } = await getFirestoreInstance();
    const { collection, getDocs } = await import('firebase/firestore');
    const col = collection(firestore, TOMBSTONES_COLLECTION);
    const snap = await getDocs(col);
    const keys = new Set<string>();
    snap.forEach(d => keys.add(d.id));
    return keys;
  } catch (error) {
    console.error('Error fetching deleted static keys:', error);
    return new Set<string>();
  }
};

/**
 * Bulk import questions (useful for migrating from static data)
 */
export const bulkImportQuestions = async (
  questions: Omit<Question, 'id'>[],
  userId: string
): Promise<void> => {
  try {
    const { firestore } = await getFirestoreInstance();
    const { writeBatch, collection, doc, Timestamp } = await import('firebase/firestore');
    const batch = writeBatch(firestore);
    const questionsRef = collection(firestore, QUESTIONS_COLLECTION);
    const now = Timestamp.now();
    
    questions.forEach((question) => {
      const docRef = doc(questionsRef);
      const originalKey = `${question.question}__${question.answer}`.toLowerCase();
      const questionData: Omit<FirebaseQuestion, 'id'> = {
        ...question,
        createdAt: now,
        updatedAt: now,
        isActive: true,
        createdBy: userId,
        source: 'static',
        originalKey
      };
      
      batch.set(docRef, questionData as import('firebase/firestore').DocumentData);
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error bulk importing questions:', error);
    throw new Error('Failed to import questions');
  }
};

/**
 * Get questions for admin management (includes inactive questions)
 */
export const getAllQuestionsForAdmin = async (): Promise<(Question & { 
  isActive: boolean; 
  createdAt: Timestamp; 
  updatedAt: Timestamp; 
  createdBy: string,
  originalKey?: string,
  source?: 'static' | 'manual'
})[]> => {
  try {
    const { firestore } = await getFirestoreInstance();
    const { collection, query, orderBy, getDocs } = await import('firebase/firestore');
    const questionsRef = collection(firestore, QUESTIONS_COLLECTION);
    const q = query(questionsRef, orderBy('updatedAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const questions: (Question & { 
      isActive: boolean; 
      createdAt: Timestamp; 
      updatedAt: Timestamp; 
      createdBy: string,
      originalKey?: string,
      source?: 'static' | 'manual'
    })[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirebaseQuestion;
      questions.push({
        id: doc.id,
        question: data.question,
        options: data.options,
        answer: data.answer,
        topic: data.topic,
        explanation: data.explanation,
        isActive: data.isActive,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdBy: data.createdBy,
        originalKey: data.originalKey,
        source: data.source
      });
    });
    
    return questions;
  } catch (error) {
    console.error('Error fetching all questions for admin:', error);
    throw new Error('Failed to load questions for admin');
  }
};





