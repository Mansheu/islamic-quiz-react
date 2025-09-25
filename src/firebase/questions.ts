import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { firestore } from './config';
import type { Question } from '../types';

export interface FirebaseQuestion extends Omit<Question, 'id'> {
  id?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  createdBy: string; // User ID of the admin who created it
}

const QUESTIONS_COLLECTION = 'questions';

/**
 * Get all questions from Firestore
 */
export const getAllQuestions = async (): Promise<Question[]> => {
  try {
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
    const questionsRef = collection(firestore, QUESTIONS_COLLECTION);
    const now = Timestamp.now();
    
    const questionData: Omit<FirebaseQuestion, 'id'> = {
      ...question,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      createdBy: userId
    };
    
    const docRef = await addDoc(questionsRef, questionData);
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
  updates: Partial<Omit<Question, 'id'>> & { isActive?: boolean }
): Promise<void> => {
  try {
    const questionRef = doc(firestore, QUESTIONS_COLLECTION, questionId);
    const now = Timestamp.now();
    
    await updateDoc(questionRef, {
      ...updates,
      updatedAt: now
    });
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
    const questionRef = doc(firestore, QUESTIONS_COLLECTION, questionId);
    const now = Timestamp.now();
    
    await updateDoc(questionRef, {
      isActive: false,
      updatedAt: now
    });
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
    const questionRef = doc(firestore, QUESTIONS_COLLECTION, questionId);
    await deleteDoc(questionRef);
  } catch (error) {
    console.error('Error permanently deleting question:', error);
    throw new Error('Failed to permanently delete question');
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
    const batch = writeBatch(firestore);
    const questionsRef = collection(firestore, QUESTIONS_COLLECTION);
    const now = Timestamp.now();
    
    questions.forEach((question) => {
      const docRef = doc(questionsRef);
      const questionData: Omit<FirebaseQuestion, 'id'> = {
        ...question,
        createdAt: now,
        updatedAt: now,
        isActive: true,
        createdBy: userId
      };
      
      batch.set(docRef, questionData);
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
  createdBy: string 
})[]> => {
  try {
    const questionsRef = collection(firestore, QUESTIONS_COLLECTION);
    const q = query(questionsRef, orderBy('updatedAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const questions: (Question & { 
      isActive: boolean; 
      createdAt: Timestamp; 
      updatedAt: Timestamp; 
      createdBy: string 
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
        createdBy: data.createdBy
      });
    });
    
    return questions;
  } catch (error) {
    console.error('Error fetching all questions for admin:', error);
    throw new Error('Failed to load questions for admin');
  }
};