// src/types/activity.ts

// Base user info for activity events
export interface ActivityUser {
  id: number;
  username: string;
  profile_picture_url: string | null;
}

// Reward info for shop purchases
export interface ActivityReward {
  id: number;
  name: string;
  image: string | null;
}

// Unified activity event type
export interface ActivityEvent {
  id: string;
  event_type: 'submission' | 'challenge_sent' | 'challenge_completed' | 'shop_purchase';
  created_at: string;

  // For submissions
  user?: ActivityUser;
  puzzle_name?: 'Sudoku' | 'Wordle' | 'ERNIgram';
  difficulty?: 'easy' | 'hard';
  time_in_minutes?: string;

  // For challenges
  challenger?: ActivityUser;
  recipient?: ActivityUser;
  status?: 'PENDING' | 'COMPLETED' | 'EXPIRED';  // ✅ ADDED 'EXPIRED'
  winner?: ActivityUser | null;
  
  // ✅ NEW: Scores for completed challenges
  challenger_score?: number;
  recipient_score?: number;

  // For shop purchases
  reward?: ActivityReward;
  points_spent?: number;
}

// Online user
export interface OnlineUser {
  id: number;
  username: string;
  profile_picture_url: string | null;
}

// Activity hub response
export interface ActivityHubResponse {
  recent_activity: ActivityEvent[];
  online_users: OnlineUser[];
}