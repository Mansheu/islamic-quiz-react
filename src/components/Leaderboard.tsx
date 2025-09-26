import React, { useState, useEffect, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import { 
  getTopPlayers, 
  getTopicLeaderboard, 
  getPlayedTopics, 
  getUserRank, 
  type LeaderboardEntry, 
  type LeaderboardFilters 
} from '../firebase/leaderboard';
import CustomLoader from './CustomLoader';
import './Leaderboard.css';

const Leaderboard: React.FC = () => {
  const [user] = useAuthState(auth);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRank, setUserRank] = useState<number>(0);
  const [playedTopics, setPlayedTopics] = useState<string[]>([]);
  
  // Filter states
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | 'week' | 'month'>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('overall');
  const [leaderboardLimit] = useState(20);

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 [Leaderboard Debug] Starting fetch with:', { selectedTopic, selectedTimeframe, leaderboardLimit });
      let players: LeaderboardEntry[];
      
      if (selectedTopic === 'overall') {
        const filters: LeaderboardFilters = {
          timeframe: selectedTimeframe,
          limit: leaderboardLimit
        };
        console.log('🔍 [Leaderboard Debug] Fetching top players with filters:', filters);
        players = await getTopPlayers(filters);
      } else {
        console.log('🔍 [Leaderboard Debug] Fetching topic leaderboard for:', selectedTopic);
        players = await getTopicLeaderboard(selectedTopic, leaderboardLimit);
      }
      
      console.log('🔍 [Leaderboard Debug] Fetched players:', players.length, 'players');
      console.log('🔍 [Leaderboard Debug] Players data:', players);
      setLeaderboard(players);
      
      // Get user's rank if they're signed in
      if (user && selectedTopic === 'overall') {
        const rank = await getUserRank(user.uid);
        setUserRank(rank);
      }
      
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to load leaderboard: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [selectedTopic, selectedTimeframe, leaderboardLimit, user]);

  // Fetch played topics for filter dropdown
  const fetchPlayedTopics = async () => {
    try {
      const topics = await getPlayedTopics();
      setPlayedTopics(topics);
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    console.log('🔍 [Leaderboard Debug] useEffect triggered, calling fetchLeaderboard');
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    fetchPlayedTopics();
  }, []);

  // Format score display
  const formatScore = (score: number) => {
    return score.toLocaleString();
  };

  // Format time since last played
  const formatTimeSince = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Get medal emoji for top 3
  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="leaderboard-container">
        <div className="card">
          <CustomLoader text="Loading leaderboard..." />
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <div className="card">
        <h2>🏆 Dawah Quiz Leaderboard</h2>
        
        {/* User's Rank Display */}
        {user && userRank > 0 && selectedTopic === 'overall' && (
          <div className="user-rank-display">
            <p>
              <strong>Your Rank: #{userRank}</strong>
              {userRank <= 3 && <span className="medal">{getMedalEmoji(userRank)}</span>}
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="leaderboard-filters">
          <div className="filter-group">
            <label htmlFor="topic-select">Category:</label>
            <select 
              id="topic-select"
              value={selectedTopic} 
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="filter-select"
            >
              <option value="overall">Overall Scores</option>
              {playedTopics.map(topic => (
                <option key={topic} value={topic}>
                  {topic.charAt(0).toUpperCase() + topic.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {selectedTopic === 'overall' && (
            <div className="filter-group">
              <label htmlFor="timeframe-select">Timeframe:</label>
              <select 
                id="timeframe-select"
                value={selectedTimeframe} 
                onChange={(e) => setSelectedTimeframe(e.target.value as 'all' | 'week' | 'month')}
                className="filter-select"
              >
                <option value="all">All Time</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          )}

          <button onClick={fetchLeaderboard} className="btn btn-secondary refresh-btn">
            🔄 Refresh
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
          </div>
        )}

        {/* Leaderboard Table */}
        {leaderboard.length > 0 ? (
          <div className="leaderboard-table">
            <div className="table-header">
              <div className="rank-col">Rank</div>
              <div className="player-col">Player</div>
              <div className="score-col">
                {selectedTopic === 'overall' ? 'Total Score' : `${selectedTopic} Score`}
              </div>
              <div className="last-played-col">Last Played</div>
            </div>

            {leaderboard.map((player) => (
              <div 
                key={player.uid} 
                className={`leaderboard-row ${user?.uid === player.uid ? 'current-user' : ''}`}
              >
                <div className="rank-col">
                  <span className="rank-number">#{player.rank}</span>
                  {player.rank <= 3 && <span className="medal">{getMedalEmoji(player.rank)}</span>}
                </div>
                
                <div className="player-col">
                  <div className="player-info">
                    {player.photoURL ? (
                      <img 
                        src={player.photoURL} 
                        alt={player.displayName}
                        className="player-avatar"
                      />
                    ) : (
                      <div className="default-avatar">
                        {player.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="player-name">
                      {player.displayName}
                      {user?.uid === player.uid && <span className="you-badge">(You)</span>}
                    </span>
                  </div>
                </div>
                
                <div className="score-col">
                  <span className="score-value">{formatScore(player.totalScore)}</span>
                </div>
                
                <div className="last-played-col">
                  <span className="time-since">{formatTimeSince(player.lastPlayed)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">
            <p>📊 No quiz data available yet.</p>
            <p>Be the first to take a quiz and claim your spot on the leaderboard!</p>
          </div>
        )}

        {/* Footer Info */}
        <div className="leaderboard-footer">
          <p>
            🎯 Compete with other members of the Mansheu Dawah community! 
            Take more quizzes to improve your ranking.
          </p>
          <p className="last-updated">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;