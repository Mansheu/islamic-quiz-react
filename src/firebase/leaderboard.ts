import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs
} from 'firebase/firestore';
import { firestore } from './config';

// Interface for leaderboard entry
export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL?: string;
  totalScore: number;
  highScores: Record<string, number>;
  lastPlayed: Date;
  rank: number;
}

// Interface for leaderboard filters
export interface LeaderboardFilters {
  timeframe: 'all' | 'week' | 'month';
  topic?: string;
  limit: number;
}

// Get top players for overall leaderboard
export const getTopPlayers = async (filters: LeaderboardFilters): Promise<LeaderboardEntry[]> => {
  try {
    console.log('📊 Fetching leaderboard with filters:', filters);
    
    const usersRef = collection(firestore, 'users');
    
    // For time-based filters, we'll fetch all users and filter in memory
    // This avoids complex Firestore indexing requirements
    const leaderboardQuery = query(
      usersRef,
      orderBy('totalScore', 'desc'),
      limit(100) // Fetch more to ensure we have enough after time filtering
    );
    
    const querySnapshot = await getDocs(leaderboardQuery);
    let players: LeaderboardEntry[] = [];
    
    const docs = querySnapshot.docs;
    docs.forEach((doc) => {
      const userData = doc.data();
      const lastPlayed = userData.lastPlayed?.toDate() || new Date();
      
      // Apply time filtering in memory
      let includePlayer = true;
      if (filters.timeframe !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        if (filters.timeframe === 'week') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (filters.timeframe === 'month') {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else {
          startDate = new Date(0);
        }
        
        includePlayer = lastPlayed >= startDate;
      }
      
      if (includePlayer && (userData.totalScore || 0) > 0) {
        players.push({
          uid: userData.uid,
          displayName: userData.displayName || 'Anonymous',
          photoURL: userData.photoURL,
          totalScore: userData.totalScore || 0,
          highScores: userData.highScores || {},
          lastPlayed: lastPlayed,
          rank: 0 // Will be set after filtering
        });
      }
    });
    
    // Sort by score again after filtering and assign ranks
    players.sort((a, b) => b.totalScore - a.totalScore);
    players = players.slice(0, filters.limit);
    players.forEach((player, index) => {
      player.rank = index + 1;
    });
    
    console.log('✅ Leaderboard fetched successfully:', players.length, 'players');
    return players;
    
  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error);
    throw error;
  }
};

// Get top players for a specific topic
export const getTopicLeaderboard = async (topic: string, limitCount: number = 10): Promise<LeaderboardEntry[]> => {
  try {
    console.log('📊 Fetching topic leaderboard for:', topic);
    
    const usersRef = collection(firestore, 'users');
    const topicQuery = query(
      usersRef,
      orderBy(`highScores.${topic}`, 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(topicQuery);
    const players: LeaderboardEntry[] = [];
    
    const docs = querySnapshot.docs;
    docs.forEach((doc, index) => {
      const userData = doc.data();
      const topicScore = userData.highScores?.[topic] || 0;
      
      // Only include players who have played this topic
      if (topicScore > 0) {
        players.push({
          uid: userData.uid,
          displayName: userData.displayName || 'Anonymous',
          photoURL: userData.photoURL,
          totalScore: topicScore, // Show topic-specific score
          highScores: userData.highScores || {},
          lastPlayed: userData.lastPlayed?.toDate() || new Date(),
          rank: index + 1
        });
      }
    });
    
    console.log('✅ Topic leaderboard fetched:', players.length, 'players');
    return players;
    
  } catch (error) {
    console.error('❌ Error fetching topic leaderboard:', error);
    throw error;
  }
};

// Get user's rank in overall leaderboard
export const getUserRank = async (userId: string): Promise<number> => {
  try {
    const usersRef = collection(firestore, 'users');
    const allUsersQuery = query(usersRef, orderBy('totalScore', 'desc'));
    
    const querySnapshot = await getDocs(allUsersQuery);
    const docs = querySnapshot.docs;
    let rank = 0;
    
    docs.forEach((doc, index) => {
      if (doc.data().uid === userId) {
        rank = index + 1;
      }
    });
    
    return rank;
    
  } catch (error) {
    console.error('Error getting user rank:', error);
    return 0;
  }
};

// Get quiz topics that have been played (for topic filter dropdown)
export const getPlayedTopics = async (): Promise<string[]> => {
  try {
    const usersRef = collection(firestore, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    const topicsSet = new Set<string>();
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.highScores) {
        Object.keys(userData.highScores).forEach(topic => {
          if (userData.highScores[topic] > 0) {
            topicsSet.add(topic);
          }
        });
      }
    });
    
    return Array.from(topicsSet).sort();
    
  } catch (error) {
    console.error('Error getting played topics:', error);
    return [];
  }
};