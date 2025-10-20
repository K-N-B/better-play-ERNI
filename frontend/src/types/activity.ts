import type { UserProfile } from './user'; // Make sure UserProfile is defined in user.ts

// Represents a single event in the recent activity feed
export interface ActivityEvent {
  id: number;
  user: Pick<UserProfile, 'id' | 'username'>; // Only need basic user info
  message: string; // e.g., "solved the Wordle!"
  created_at: string; // ISO 8601 date string (e.g., "2025-10-20T16:30:00Z")
}

// Represents a user currently online
export interface OnlineUser {
  id: number;
  username: string;
}

// The combined response expected from the /api/activity-hub/ endpoint
export interface ActivityHubResponse {
  recent_activity: ActivityEvent[];
  online_users: OnlineUser[];
}