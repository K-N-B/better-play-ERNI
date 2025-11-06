import type { UserProfile } from './user'; // Make sure UserProfile is defined in user.ts

// Represents a single event in the recent activity feed
export interface ActivityEvent {
  id: number;
  user: Pick<UserProfile, 'id' | 'username'>;
  puzzle_name: 'Sudoku' | 'Wordle' | 'ERNIgram'; // The name of the puzzle
  difficulty: 'easy' | 'hard';
  time_in_minutes: string; // Formatted time string, e.g., "4:98"
  created_at: string; // ISO 8601 date string

  // 'message' is no longer needed as we will construct it dynamically
  // message: string;
}

// ... (OnlineUser and ActivityHubResponse remain the same for now)
export interface OnlineUser {
  id: number;
  username: string;
}
export interface ActivityHubResponse {
  recent_activity: ActivityEvent[];
  online_users: OnlineUser[];
}
