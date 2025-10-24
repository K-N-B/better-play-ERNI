import { MOCK_MODE, mockApiCall, API_BASE_URL } from './api';

// ============================================
// USER STATS
// ============================================
export interface UserStats {
  total_points_daily: number;
  total_points_weekly: number;
  total_points_monthly: number;
  total_points_alltime: number;
  current_streak: number;
  max_streak: number;
  puzzles_completed_today: number;
  total_submissions: number;
}

export const getUserStats = async (): Promise<UserStats> => {
  if (MOCK_MODE) {
    console.log('[MOCK] Fetching user stats...');
    return mockApiCall({
      total_points_daily: 300,
      total_points_weekly: 1200,
      total_points_monthly: 5000,
      total_points_alltime: 15000,
      current_streak: 7,
      max_streak: 14,
      puzzles_completed_today: 2,
      total_submissions: 45,
    });
  }
  
  const response = await fetch(`${API_BASE_URL}/users/stats/`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user stats');
  }
  
  return response.json();
};

// ============================================
// ACTIVITY FEED
// ============================================
export interface ActivityFeedEntry {
  id: number;
  user: {
    id: number;
    username: string;
    avatar_url: string | null;
  };
  event_type: 'puzzle_completed' | 'streak_milestone' | 'leaderboard_top' | 'achievement_unlocked';
  puzzle_type?: string;
  points: number;
  tries?: number;
  metadata: Record<string, any>;
  created_at: string;
  time_ago: string;
}

export const getActivityFeed = async (limit: number = 50): Promise<ActivityFeedEntry[]> => {
  if (MOCK_MODE) {
    console.log('[MOCK] Fetching activity feed...');
    return mockApiCall([
      {
        id: 1,
        user: { id: 1, username: 'john_doe', avatar_url: null },
        event_type: 'puzzle_completed' as const,
        puzzle_type: 'wordle',
        points: 145,
        tries: 3,
        metadata: {},
        created_at: new Date().toISOString(),
        time_ago: '5 mins ago',
      },
      {
        id: 2,
        user: { id: 2, username: 'jane_smith', avatar_url: null },
        event_type: 'streak_milestone' as const,
        points: 0,
        metadata: { streak_count: 7 },
        created_at: new Date().toISOString(),
        time_ago: '10 mins ago',
      },
    ]);
  }
  
  const response = await fetch(`${API_BASE_URL}/activity-feed/?limit=${limit}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch activity feed');
  }
  
  return response.json();
};

// ============================================
// WHO'S ONLINE
// ============================================
export interface OnlineUser {
  id: number;
  username: string;
  avatar_url: string | null;
}

export const getWhosOnline = async (): Promise<OnlineUser[]> => {
  if (MOCK_MODE) {
    console.log('[MOCK] Fetching online users...');
    return mockApiCall([
      { id: 2, username: 'jane_smith', avatar_url: null },
      { id: 3, username: 'bob_jones', avatar_url: null },
      { id: 4, username: 'alice_wonder', avatar_url: null },
    ]);
  }
  
  const response = await fetch(`${API_BASE_URL}/users/online/`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch online users');
  }
  
  return response.json();
};