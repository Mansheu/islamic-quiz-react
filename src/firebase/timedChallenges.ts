import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where,
  serverTimestamp,
  Timestamp,
  FieldValue
} from 'firebase/firestore';
import { firestore } from './config';
import type { ChallengeResult } from '../types';

// Interface for Firebase timed challenge data
export interface TimedChallengeFirebaseResult extends Omit<ChallengeResult, 'completedAt'> {
  userId: string;
  completedAt: FieldValue | Timestamp | Date;
  isPersonalBest: boolean;
}

export interface TimedChallengeUserProfile {
  userId: string;
  personalBests: Record<string, ChallengeResult>;
  totalTimedChallenges: number;
  bestOverallGrade: string;
  lastChallengeDate: FieldValue | Timestamp | Date;
  updatedAt: FieldValue | Timestamp | Date;
}

// Save a timed challenge result to Firebase
export const saveTimedChallengeResult = async (
  userId: string, 
  result: ChallengeResult,
  isPersonalBest: boolean = false
): Promise<void> => {
  try {
    console.log('💾 Saving timed challenge result to Firebase:', { userId, challengeId: result.challengeId, score: result.score });
    
    // Save individual result
    const resultId = `${userId}_${result.challengeId}_${Date.now()}`;
    const resultRef = doc(firestore, 'timedChallengeResults', resultId);
    
    const firebaseResult: TimedChallengeFirebaseResult = {
      ...result,
      userId,
      completedAt: serverTimestamp(),
      isPersonalBest
    };
    
    await setDoc(resultRef, firebaseResult);
    
    // Update user's timed challenge profile
    await updateTimedChallengeProfile(userId, result, isPersonalBest);
    
    console.log('✅ Timed challenge result saved successfully');
    
  } catch (error) {
    console.error('❌ Error saving timed challenge result:', error);
    throw new Error(`Failed to save timed challenge result: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Update user's timed challenge profile with personal bests
export const updateTimedChallengeProfile = async (
  userId: string, 
  newResult: ChallengeResult,
  isNewPersonalBest: boolean
): Promise<void> => {
  try {
    const profileRef = doc(firestore, 'timedChallengeProfiles', userId);
    const profileDoc = await getDoc(profileRef);
    
    let profile: TimedChallengeUserProfile;
    
    if (profileDoc.exists()) {
      const existingProfile = profileDoc.data() as TimedChallengeUserProfile;
      profile = {
        ...existingProfile,
        totalTimedChallenges: existingProfile.totalTimedChallenges + 1,
        lastChallengeDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Update personal best if this is a new record
      if (isNewPersonalBest) {
        profile.personalBests = {
          ...existingProfile.personalBests,
          [newResult.challengeId]: newResult
        };
        
        // Update best overall grade
        const allGrades = Object.values(profile.personalBests).map(best => best.grade);
        allGrades.push(newResult.grade);
        profile.bestOverallGrade = getBestGrade(allGrades);
      }
    } else {
      // Create new profile
      profile = {
        userId,
        personalBests: isNewPersonalBest ? { [newResult.challengeId]: newResult } : {},
        totalTimedChallenges: 1,
        bestOverallGrade: isNewPersonalBest ? newResult.grade : 'D',
        lastChallengeDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
    }
    
    await setDoc(profileRef, profile, { merge: true });
    console.log('✅ Timed challenge profile updated');
    
  } catch (error) {
    console.error('❌ Error updating timed challenge profile:', error);
    throw error;
  }
};

// Get user's timed challenge profile
export const getTimedChallengeProfile = async (userId: string): Promise<TimedChallengeUserProfile | null> => {
  try {
    console.log('📊 Fetching timed challenge profile for user:', userId);
    
    const profileRef = doc(firestore, 'timedChallengeProfiles', userId);
    const profileDoc = await getDoc(profileRef);
    
    if (!profileDoc.exists()) {
      console.log('📊 No timed challenge profile found for user');
      return null;
    }
    
    const profile = profileDoc.data() as TimedChallengeUserProfile;
    
    // Convert Timestamp fields to Date objects for consistency
    const processedProfile = {
      ...profile,
      lastChallengeDate: profile.lastChallengeDate instanceof Timestamp 
        ? profile.lastChallengeDate.toDate() 
        : profile.lastChallengeDate,
      updatedAt: profile.updatedAt instanceof Timestamp 
        ? profile.updatedAt.toDate() 
        : profile.updatedAt,
      personalBests: Object.fromEntries(
        Object.entries(profile.personalBests || {}).map(([challengeId, best]) => [
          challengeId,
          {
            ...best,
            completedAt: typeof best.completedAt === 'string' ? best.completedAt : new Date().toISOString()
          }
        ])
      )
    };
    
    console.log('✅ Timed challenge profile fetched:', processedProfile);
    return processedProfile;
    
  } catch (error) {
    console.error('❌ Error fetching timed challenge profile:', error);
    return null;
  }
};

// Get timed challenge leaderboard for a specific challenge
export const getTimedChallengeLeaderboard = async (challengeId: string, limitCount: number = 10): Promise<TimedChallengeFirebaseResult[]> => {
  try {
    console.log('🏆 Fetching timed challenge leaderboard for:', challengeId);
    
    const resultsRef = collection(firestore, 'timedChallengeResults');
    const leaderboardQuery = query(
      resultsRef,
      where('challengeId', '==', challengeId),
      where('isPersonalBest', '==', true), // Only personal bests
      orderBy('score', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(leaderboardQuery);
    const results: TimedChallengeFirebaseResult[] = [];
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data() as TimedChallengeFirebaseResult;
      results.push({
        ...data,
        completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : data.completedAt
      });
    });
    
    console.log('✅ Timed challenge leaderboard fetched:', results.length, 'results');
    return results;
    
  } catch (error) {
    console.error('❌ Error fetching timed challenge leaderboard:', error);
    return [];
  }
};

// Get all timed challenge results for a user
export const getUserTimedChallengeResults = async (userId: string): Promise<TimedChallengeFirebaseResult[]> => {
  try {
    const resultsRef = collection(firestore, 'timedChallengeResults');
    const userResultsQuery = query(
      resultsRef,
      where('userId', '==', userId),
      orderBy('completedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(userResultsQuery);
    const results: TimedChallengeFirebaseResult[] = [];
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data() as TimedChallengeFirebaseResult;
      results.push({
        ...data,
        completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : data.completedAt
      });
    });
    
    return results;
    
  } catch (error) {
    console.error('❌ Error fetching user timed challenge results:', error);
    return [];
  }
};

// Helper function to determine the best grade from an array of grades
const getBestGrade = (grades: string[]): string => {
  if (grades.length === 0) return 'D';
  
  const gradeOrder = { 'S': 0, 'A': 1, 'B': 2, 'C': 3, 'D': 4 };
  return grades.sort((a, b) => {
    return (gradeOrder[a as keyof typeof gradeOrder] || 5) - (gradeOrder[b as keyof typeof gradeOrder] || 5);
  })[0];
};

// Migrate localStorage data to Firebase (one-time migration helper)
export const migrateLocalStorageToFirebase = async (userId: string, localPersonalBests: Record<string, ChallengeResult>): Promise<void> => {
  try {
    console.log('🔄 Migrating localStorage data to Firebase...');
    
    for (const [, result] of Object.entries(localPersonalBests)) {
      await saveTimedChallengeResult(userId, result, true);
    }
    
    console.log('✅ Migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};