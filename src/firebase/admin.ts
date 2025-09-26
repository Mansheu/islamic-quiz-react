import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  limit,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  writeBatch,
  collectionGroup
} from 'firebase/firestore';
import { firestore } from './config';

// Admin user check (you can customize this logic)
const ADMIN_EMAILS = [
  'babakartijaniyshaykhaniy@gmail.com'
];

export const isAdmin = (userEmail: string | null): boolean => {
  if (!userEmail) return false;
  return ADMIN_EMAILS.includes(userEmail.toLowerCase());
};

// Interface for admin analytics
export interface AdminAnalytics {
  totalUsers: number;
  totalQuizzesTaken: number;
  averageScore: number;
  topTopics: Array<{ topic: string; count: number }>;
  recentActivity: Array<{
    userId: string;
    displayName: string;
    action: string;
    timestamp: Date;
  }>;
  userGrowth: Array<{ date: string; count: number }>;
}

// Interface for user management
export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  totalScore: number;
  quizzesCompleted: number;
  joinedAt: Date;
  lastPlayed: Date;
  isActive: boolean;
}

// Get comprehensive admin analytics
export const getAdminAnalytics = async (): Promise<AdminAnalytics> => {
  try {
    console.log('📊 Fetching admin analytics...');
    
    const usersRef = collection(firestore, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    let totalUsers = 0;
    let totalQuizzesTaken = 0;
    let totalScores = 0;
    const topicCounts: Record<string, number> = {};
    const userGrowthData: Record<string, number> = {};
    const recentActivity: AdminAnalytics['recentActivity'] = [];
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      totalUsers++;
      
      // Calculate quiz statistics
      if (userData.highScores) {
        const userQuizCount = Object.keys(userData.highScores).length;
        totalQuizzesTaken += userQuizCount;
        
        // Count topic popularity
        Object.keys(userData.highScores).forEach(topic => {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });
      }
      
      if (userData.totalScore) {
        totalScores += userData.totalScore;
      }
      
      // Track user growth by month
      if (userData.joinedAt) {
        const joinDate = userData.joinedAt.toDate();
        const monthKey = `${joinDate.getFullYear()}-${String(joinDate.getMonth() + 1).padStart(2, '0')}`;
        userGrowthData[monthKey] = (userGrowthData[monthKey] || 0) + 1;
      }
      
      // Add recent activity
      if (userData.lastPlayed) {
        const lastPlayedDate = userData.lastPlayed.toDate();
        const daysSinceLastPlayed = Math.floor((Date.now() - lastPlayedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastPlayed <= 7) { // Recent activity within 7 days
          recentActivity.push({
            userId: userData.uid,
            displayName: userData.displayName || 'Anonymous',
            action: 'Completed Quiz',
            timestamp: lastPlayedDate
          });
        }
      }
    });
    
    // Format top topics
    const topTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));
    
    // Format user growth data
    const userGrowth = Object.entries(userGrowthData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
    
    // Sort recent activity by timestamp
    recentActivity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    const analytics: AdminAnalytics = {
      totalUsers,
      totalQuizzesTaken,
      averageScore: totalUsers > 0 ? Math.round(totalScores / totalUsers) : 0,
      topTopics,
      recentActivity: recentActivity.slice(0, 20), // Limit to 20 recent activities
      userGrowth
    };
    
    console.log('✅ Admin analytics fetched successfully');
    return analytics;
    
  } catch (error) {
    console.error('❌ Error fetching admin analytics:', error);
    throw error;
  }
};

// Get all users for admin management
export const getAllUsers = async (): Promise<AdminUser[]> => {
  try {
    console.log('👥 Fetching all users for admin...');
    
    const usersRef = collection(firestore, 'users');
    const usersQuery = query(usersRef, orderBy('joinedAt', 'desc'));
    const usersSnapshot = await getDocs(usersQuery);
    
    const users: AdminUser[] = [];
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      const joinedAt = userData.joinedAt?.toDate() || new Date();
      const lastPlayed = userData.lastPlayed?.toDate() || new Date();
      const daysSinceLastPlayed = Math.floor((Date.now() - lastPlayed.getTime()) / (1000 * 60 * 60 * 24));
      
      users.push({
        uid: userData.uid,
        email: userData.email || 'No email',
        displayName: userData.displayName || 'Anonymous',
        photoURL: userData.photoURL,
        totalScore: userData.totalScore || 0,
        quizzesCompleted: userData.highScores ? Object.keys(userData.highScores).length : 0,
        joinedAt,
        lastPlayed,
        isActive: daysSinceLastPlayed <= 30 // Consider active if played within 30 days
      });
    });
    
    console.log('✅ All users fetched for admin:', users.length, 'users');
    return users;
    
  } catch (error) {
    console.error('❌ Error fetching users for admin:', error);
    throw error;
  }
};

// Get quiz statistics by topic
export const getQuizStatsByTopic = async (): Promise<Array<{
  topic: string;
  totalPlayers: number;
  averageScore: number;
  highestScore: number;
  completionRate: number;
}>> => {
  try {
    console.log('📈 Fetching quiz statistics by topic...');
    
    const usersRef = collection(firestore, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const topicStats: Record<string, {
      players: number;
      totalScore: number;
      highestScore: number;
      scores: number[];
    }> = {};
    
    let totalUsersWithQuizzes = 0;
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      
      if (userData.highScores && Object.keys(userData.highScores).length > 0) {
        totalUsersWithQuizzes++;
        
        Object.entries(userData.highScores).forEach(([topic, score]) => {
          const numScore = Number(score);
          
          if (!topicStats[topic]) {
            topicStats[topic] = {
              players: 0,
              totalScore: 0,
              highestScore: 0,
              scores: []
            };
          }
          
          topicStats[topic].players++;
          topicStats[topic].totalScore += numScore;
          topicStats[topic].highestScore = Math.max(topicStats[topic].highestScore, numScore);
          topicStats[topic].scores.push(numScore);
        });
      }
    });
    
    // Convert to final format
    const statsArray = Object.entries(topicStats).map(([topic, stats]) => ({
      topic,
      totalPlayers: stats.players,
      averageScore: Math.round(stats.totalScore / stats.players),
      highestScore: stats.highestScore,
      completionRate: totalUsersWithQuizzes > 0 ? Math.round((stats.players / totalUsersWithQuizzes) * 100) : 0
    }));
    
    // Sort by total players descending
    statsArray.sort((a, b) => b.totalPlayers - a.totalPlayers);
    
    console.log('✅ Quiz statistics by topic fetched successfully');
    return statsArray;
    
  } catch (error) {
    console.error('❌ Error fetching quiz statistics:', error);
    throw error;
  }
};

// Admin function to update user data (use with caution)
export const adminUpdateUser = async (userId: string, updates: Partial<{
  displayName: string;
  totalScore: number;
  isBlocked: boolean;
}>) => {
  try {
    console.log('⚙️ Admin updating user:', userId, updates);
    
    const userDocRef = doc(firestore, 'users', userId);
    await updateDoc(userDocRef, {
      ...updates,
      lastModified: Timestamp.fromDate(new Date()),
      modifiedBy: 'admin'
    });
    
    console.log('✅ User updated successfully by admin');
    
  } catch (error) {
    console.error('❌ Error updating user as admin:', error);
    throw error;
  }
};

// Admin function to delete user (use with extreme caution)
export const adminDeleteUser = async (userId: string) => {
  try {
    console.log('🗑️ Admin deleting user:', userId);
    
    const userDocRef = doc(firestore, 'users', userId);
    await deleteDoc(userDocRef);
    
    console.log('✅ User deleted successfully by admin');
    
  } catch (error) {
    console.error('❌ Error deleting user as admin:', error);
    throw error;
  }
};

// Get system health metrics
export const getSystemHealth = async (): Promise<{
  dbConnectionStatus: 'healthy' | 'warning' | 'error';
  totalDocuments: number;
  averageResponseTime: number;
  errorRate: number;
}> => {
  try {
    const startTime = Date.now();
    
    // Test database connection
    const usersRef = collection(firestore, 'users');
    const testQuery = query(usersRef, limit(1));
    await getDocs(testQuery);
    
    const responseTime = Date.now() - startTime;
    
    // Count total documents
    const allUsersSnapshot = await getDocs(usersRef);
    const totalDocuments = allUsersSnapshot.size;
    
    return {
      dbConnectionStatus: responseTime < 1000 ? 'healthy' : responseTime < 3000 ? 'warning' : 'error',
      totalDocuments,
      averageResponseTime: responseTime,
      errorRate: 0 // This would need to be tracked over time
    };
    
  } catch (error) {
    console.error('❌ Error checking system health:', error);
    return {
      dbConnectionStatus: 'error',
      totalDocuments: 0,
      averageResponseTime: 0,
      errorRate: 100
    };
  }
};

// Admin function to reset all user scores and data
export const resetAllUserScores = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // List of all top-level collections to clear (skip 'admins')
    const collections = [
      'users',
      'achievements',
      'streaks',
      'leaderboard',
      'timedChallengeResults',
      'timedChallengeProfiles'
    ];
    let totalDocuments = 0;
    let batch = writeBatch(firestore);
    let batchCount = 0;
    // Delete all documents in each collection
    for (const collectionName of collections) {
      const collectionRef = collection(firestore, collectionName);
      const snapshot = await getDocs(collectionRef);
      for (const doc of snapshot.docs) {
        batch.delete(doc.ref);
        totalDocuments++;
        batchCount++;
        if (batchCount === 490) {
          await batch.commit();
          batch = writeBatch(firestore);
          batchCount = 0;
        }
      }
    }
    // Also delete any documents in subcollections (if any)
    const groupCollections = [
      'leaderboard',
      'timedChallengeResults',
      'timedChallengeProfiles'
    ];
    for (const groupName of groupCollections) {
      const groupQuery = collectionGroup(firestore, groupName);
      const groupSnapshot = await getDocs(groupQuery);
      for (const doc of groupSnapshot.docs) {
        batch.delete(doc.ref);
        totalDocuments++;
        batchCount++;
        if (batchCount === 490) {
          await batch.commit();
          batch = writeBatch(firestore);
          batchCount = 0;
        }
      }
    }
    if (batchCount > 0) {
      await batch.commit();
    }
    return {
      success: true,
      message: `Successfully reset ${totalDocuments} documents across all collections.`
    };
  } catch (error) {
    console.error('❌ Error resetting all user scores:', error);
    return {
      success: false,
      message: `Failed to reset all user scores: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Admin function to reset scores for a specific user
export const resetUserScores = async (userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const batch = writeBatch(firestore);
    const collections = [
      'achievements',
      'streaks', 
      'leaderboard',
      'timedChallengeResults',
      'timedChallengeProfiles'
    ];
    
    let totalDocuments = 0;
    
    // Reset user documents in each collection
    for (const collectionName of collections) {
      if (collectionName === 'timedChallengeResults') {
        // For timedChallengeResults, we need to query by userId field
        const collectionRef = collection(firestore, collectionName);
        const q = query(collectionRef);
        const snapshot = await getDocs(q);
        
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.userId === userId) {
            batch.delete(docSnap.ref);
            totalDocuments++;
          }
        });
      } else {
        // For other collections, document ID is the userId
        const docRef = doc(firestore, collectionName, userId);
        batch.delete(docRef);
        totalDocuments++;
      }
    }
    
    // Reset user stats but keep profile info
    const userRef = doc(firestore, 'users', userId);
    batch.update(userRef, {
      totalScore: 0,
      quizzesCompleted: 0,
      correctAnswers: 0,
      totalQuestionsAnswered: 0,
      perfectScores: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastPlayed: null
    });
    
    // Commit the batch
    await batch.commit();
    
    return {
      success: true,
      message: `Successfully reset ${totalDocuments} documents for user ${userId}`
    };
    
  } catch (error) {
    console.error('❌ Error resetting user scores:', error);
    return {
      success: false,
      message: `Failed to reset user scores: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Admin function to reset only timed challenge records for a specific user
export const resetUserTimedChallenges = async (userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const batch = writeBatch(firestore);
    let totalDocuments = 0;
    
    // Reset timed challenge results
    const timedResultsRef = collection(firestore, 'timedChallengeResults');
    const resultsQuery = query(timedResultsRef);
    const resultsSnapshot = await getDocs(resultsQuery);
    
    resultsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.userId === userId) {
        batch.delete(docSnap.ref);
        totalDocuments++;
      }
    });
    
    // Reset timed challenge profile
    const profileRef = doc(firestore, 'timedChallengeProfiles', userId);
    batch.delete(profileRef);
    totalDocuments++;
    
    // Commit the batch
    await batch.commit();
    
    return {
      success: true,
      message: `Successfully reset ${totalDocuments} timed challenge records for user ${userId}`
    };
    
  } catch (error) {
    console.error('❌ Error resetting user timed challenges:', error);
    return {
      success: false,
      message: `Failed to reset timed challenges: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
