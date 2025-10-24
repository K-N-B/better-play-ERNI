import { MOCK_MODE, mockApiCall, API_BASE_URL } from './api';
import type { 
  LeaderboardData, 
  LeaderboardPeriod, 
  LeaderboardType 
} from '../types/leaderboard';

// Mock data for testing
const MOCK_LEADERBOARD_DATA: LeaderboardData = [
  {
    user: { id: 1, username: 'john_doe', avatar_url: null },
    rank: 1,
    score: 500,
    previous_rank: 2
  },
  {
    user: { id: 2, username: 'jane_smith', avatar_url: null },
    rank: 2,
    score: 450,
    previous_rank: 1
  },
  {
    user: { id: 3, username: 'bob_jones', avatar_url: null },
    rank: 3,
    score: 400,
    previous_rank: 3
  },
  {
    user: { id: 4, username: 'alice_wonder', avatar_url: null },
    rank: 4,
    score: 350,
    previous_rank: 5
  },
  {
    user: { id: 5, username: 'charlie_brown', avatar_url: null },
    rank: 5,
    score: 300,
    previous_rank: 4
  },
];

// ============================================
// GET LEADERBOARD
// ============================================
export const getLeaderboard = async (
  period: LeaderboardPeriod,
  type: LeaderboardType,
  limit: number = 100
): Promise<LeaderboardData> => {
  if (MOCK_MODE) {
    console.log(`[MOCK] Fetching ${period} ${type} leaderboard...`);
    return mockApiCall(MOCK_LEADERBOARD_DATA);
  }
  
  const response = await fetch(
    `${API_BASE_URL}/leaderboards/${period}/${type}/?limit=${limit}`,
    {
      credentials: 'include',
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch leaderboard');
  }
  
  return response.json();
};

// ============================================
// GET USER RANK (Optional - for future use)
// ============================================
export const getUserRank = async (
  userId: number,
  period: LeaderboardPeriod
): Promise<{ rank: number; score: number } | null> => {
  if (MOCK_MODE) {
    console.log(`[MOCK] Fetching rank for user ${userId}...`);
    return mockApiCall({ rank: 10, score: 250 });
  }
  
  // This would need a backend endpoint like:
  // GET /api/leaderboards/{period}/user/{userId}/
  const response = await fetch(
    `${API_BASE_URL}/leaderboards/${period}/user/${userId}/`,
    {
      credentials: 'include',
    }
  );
  
  if (!response.ok) {
    return null;
  }
  
  return response.json();
};