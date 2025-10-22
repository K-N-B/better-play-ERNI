import type { UserProfile } from './user';
import type { Submission } from './game'; // Assuming Submission type is defined

export type ChallengeStatus = 'PENDING' | 'COMPLETED' | 'EXPIRED';

// Data structure for a challenge object received from the backend
export interface Challenge {
    id: number;
    challenger: Pick<UserProfile, 'id' | 'username'>;
    recipient: Pick<UserProfile, 'id' | 'username'>;
    puzzle_type: 'wordle' | 'sudoku' | 'ernigram'; // What type of puzzle was it
    puzzle_id: number; // Specific puzzle ID
    challenger_submission: Pick<Submission, 'id' | 'points_awarded' | 'time_taken_ms' | 'tries'>;
    recipient_submission: Pick<Submission, 'id' | 'points_awarded' | 'time_taken_ms' | 'tries'> | null; // Recipient's score (null if pending)
    status: ChallengeStatus;
    winner: Pick<UserProfile, 'id' | 'username'> | null; // Who won (null if pending/tie?)
    created_at: string; // ISO date string
}

// Data structure for creating a challenge (sending to backend)
export interface CreateChallengeData {
    recipient_id: number;
    submission_id: number; // The ID of the submission the challenger just made
}

// Data structure for completing a challenge (sending to backend)
export interface CompleteChallengeData {
    submission_id: number; // The ID of the submission the recipient just made
}