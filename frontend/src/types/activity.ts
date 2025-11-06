// /src/types/activity.ts

import type { UserProfile } from './user';

// Represents a single event in the recent activity feed
export interface ActivityEvent {
  id: number;
  user: Pick<UserProfile, 'id' | 'username' | 'profile_picture_url'>; // ✅ Added profile_picture_url to Pick
  puzzle_name: 'Sudoku' | 'Wordle' | 'ERNIgram';
  difficulty: 'easy' | 'hard';
  time_in_minutes: string; // Formatted time string, e.g., "4:98"
  created_at: string; // ISO 8601 date string
}

// Represents a user currently online
export interface OnlineUser {
  id: number;
  username: string;
  profile_picture_url: string | null; // ✅ Added profile_picture_url
}

// Response from the activity hub API
export interface ActivityHubResponse {
  recent_activity: ActivityEvent[];
  online_users: OnlineUser[];
}