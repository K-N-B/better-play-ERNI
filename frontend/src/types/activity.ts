// src/types/activity.ts

import type { UserProfile } from './user';

// Base user info for activity events
export interface ActivityUser {
  id: number;
  username: string;
  profile_picture_url: string | null;
}

// Unified activity event type
export interface ActivityEvent {
  id: string; // Format: "sub_123" or "chal_sent_45" or "chal_comp_45"
  event_type: 'submission' | 'challenge_sent' | 'challenge_completed';
  created_at: string; // ISO 8601 date string
  
  // For submissions
  user?: ActivityUser;
  puzzle_name?: 'Sudoku' | 'Wordle' | 'ERNIgram';
  difficulty?: 'easy' | 'hard';
  time_in_minutes?: string;
  
  // For challenges
  challenger?: ActivityUser;
  recipient?: ActivityUser;
  status?: 'PENDING' | 'COMPLETED';
  winner?: ActivityUser | null;
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