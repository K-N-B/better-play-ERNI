// types/leaderboard.ts
import type { UserProfile, Department } from "./user";

// Structure for an individual score entry
export interface IndividualScoreEntry {
  user: Pick<UserProfile, "id" | "username" | "profile_picture_url">;  
  score: number;
  date?: string;
  week_start_date?: string;
  month_start_date?: string;
}

// Structure for a department score entry
export interface DepartmentScoreEntry {
  department: Pick<Department, "id" | "name">;
  score: number;
  date?: string;
  week_start_date?: string;
  month_start_date?: string;
}

// Union type for the API response
export type LeaderboardData = IndividualScoreEntry[] | DepartmentScoreEntry[];

// Define the period types
export type LeaderboardPeriod = "daily" | "weekly" | "monthly" | "all_time";

// Define the leaderboard type
export type LeaderboardType = "individual" | "department";