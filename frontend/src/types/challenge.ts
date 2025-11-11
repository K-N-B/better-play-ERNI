// frontend/src/types/challenge.ts - COMPLETE FILE
import type { UserProfile } from "./user";

export type ChallengeStatus = "PENDING" | "COMPLETED" | "EXPIRED";

// ✅ Extended submission info to include difficulty
export interface ChallengeSubmission {
  id: number;
  points_awarded: number;
  time_taken_ms: number;
  tries: number;
  difficulty: "easy" | "hard"; // ✅ ADDED difficulty field
}

// Data structure for a challenge object received from the backend
export interface Challenge {
  id: number;
  challenger: Pick<UserProfile, "id" | "username">;
  recipient: Pick<UserProfile, "id" | "username">;
  puzzle_type: "wordle" | "sudoku" | "ernigram";
  puzzle_id: number;
  challenger_submission: ChallengeSubmission; // ✅ Now includes difficulty
  recipient_submission: ChallengeSubmission | null;
  status: ChallengeStatus;
  winner: Pick<UserProfile, "id" | "username"> | null;
  created_at: string;
}

// Data structure for creating a challenge (sending to backend)
export interface CreateChallengeData {
  recipient_id: number;
  submission_id: number;
}

// Data structure for completing a challenge (sending to backend)
export interface CompleteChallengeData {
  submission_id: number;
}
