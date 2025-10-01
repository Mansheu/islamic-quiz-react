import type { Question } from '../types';
import type { Timestamp, DocumentData } from 'firebase/firestore';
import { getFirestoreInstance } from './config';

export type ReportStatus = 'open' | 'resolved' | 'dismissed';
export type ReportType = 'incorrect' | 'unclear' | 'typo' | 'other';

export interface QuestionReport {
  id?: string;
  questionId?: string; // Firestore question ID if available
  questionText: string;
  answer: string;
  topic: string;
  options: string[];
  reportType: ReportType;
  message?: string;
  userId: string; // reporter
  status: ReportStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const REPORTS_COLLECTION = 'questionReports';

export const submitQuestionReport = async (
  userId: string,
  q: Question,
  reportType: ReportType,
  message?: string,
): Promise<string> => {
  const { firestore } = await getFirestoreInstance();
  const { Timestamp, collection, addDoc } = await import('firebase/firestore');
  const now = Timestamp.now();
  
  // Build data object, only include message if it has content
  const data: Partial<Omit<QuestionReport, 'id'>> = {
    questionId: q.id,
    questionText: q.question,
    answer: q.answer,
    topic: q.topic,
    options: q.options,
    reportType,
    userId,
    status: 'open' as ReportStatus,
    createdAt: now,
    updatedAt: now,
  };
  
  // Only add message field if it's not empty
  if (message && message.trim()) {
    data.message = message.trim();
  }
  
  const ref = await addDoc(collection(firestore, REPORTS_COLLECTION), data as DocumentData);
  return ref.id;
};

export const getAllReports = async (): Promise<QuestionReport[]> => {
  const { collection, query, orderBy, getDocs } = await import('firebase/firestore');
  const { firestore } = await getFirestoreInstance();
  const q = query(collection(firestore, REPORTS_COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  const out: QuestionReport[] = [];
  snap.forEach((d) => {
    out.push({ id: d.id, ...(d.data() as QuestionReport) });
  });
  return out;
};

export const updateReportStatus = async (reportId: string, status: ReportStatus): Promise<void> => {
  const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
  const { firestore } = await getFirestoreInstance();
  const ref = doc(firestore, REPORTS_COLLECTION, reportId);
  await updateDoc(ref, { status, updatedAt: Timestamp.now() } as DocumentData);
};

