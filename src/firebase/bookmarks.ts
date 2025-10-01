import type { Question } from '../types';
import type { DocumentData, Timestamp } from 'firebase/firestore';
import { getFirestoreInstance } from './config';

export interface BookmarkDoc {
  key: string; // lowercased `${question}__${answer}`
  question: string;
  answer: string;
  topic: string;
  options: string[];
  questionId?: string; // Firestore question id if available
  createdAt: Timestamp | DocumentData;
}

const userBookmarksCol = async (userId: string) => {
  const { firestore } = await getFirestoreInstance();
  const { collection } = await import('firebase/firestore');
  return collection(firestore, 'users', userId, 'bookmarks');
};

export const makeQuestionKey = (q: Pick<Question, 'question' | 'answer'>): string =>
  `${q.question}__${q.answer}`.toLowerCase();

export const getBookmarks = async (userId: string): Promise<BookmarkDoc[]> => {
  const col = await userBookmarksCol(userId);
  const { getDocs } = await import('firebase/firestore');
  const snap = await getDocs(col);
  const out: BookmarkDoc[] = [];
  snap.forEach((d) => {
    out.push(d.data() as BookmarkDoc);
  });
  return out;
};

export const getBookmarksCount = async (userId: string): Promise<number> => {
  const col = await userBookmarksCol(userId);
  const { getDocs } = await import('firebase/firestore');
  const snap = await getDocs(col);
  return snap.size;
};

export const addBookmark = async (userId: string, q: Question): Promise<void> => {
  const key = makeQuestionKey(q);
  const col = await userBookmarksCol(userId);
  const { doc, setDoc, Timestamp } = await import('firebase/firestore');
  const ref = doc(col, key);
  const data: BookmarkDoc = {
    key,
    question: q.question,
    answer: q.answer,
    topic: q.topic,
    options: q.options,
    questionId: q.id,
    createdAt: Timestamp.now(),
  };
  await setDoc(ref, data as import('firebase/firestore').DocumentData);
};

export const removeBookmark = async (userId: string, q: Question): Promise<void> => {
  const key = makeQuestionKey(q);
  const col = await userBookmarksCol(userId);
  const { doc, deleteDoc } = await import('firebase/firestore');
  const ref = doc(col, key);
  await deleteDoc(ref);
};

export const clearAllBookmarks = async (userId: string): Promise<void> => {
  const col = await userBookmarksCol(userId);
  const { getDocs, deleteDoc } = await import('firebase/firestore');
  const snap = await getDocs(col);
  
  const deletePromises = snap.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
};

