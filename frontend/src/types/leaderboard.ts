import type { UserProfile, Department } from "./user"; // Changed Team to Department

// Structure for an individual score entry (no change needed here)
export interface IndividualScoreEntry {
  user: Pick<UserProfile, "id" | "username">;
  score: number;
  date?: string;
  week_start_date?: string;
  month_start_date?: string;
}

// Structure for a department score entry
export interface DepartmentScoreEntry {
  // Renamed from TeamScoreEntry
  department: Pick<Department, "id" | "name">; // Changed team to department
  score: number;
  date?: string;
  week_start_date?: string;
  month_start_date?: string;
}

// Union type for the API response
export type LeaderboardData = IndividualScoreEntry[] | DepartmentScoreEntry[]; // Updated type name

// Define the period types (no change)
export type LeaderboardPeriod = "daily" | "weekly" | "monthly" | "all_time";

// Define the leaderboard type (updated value)
export type LeaderboardType = "individual" | "department"; // Changed team to department
