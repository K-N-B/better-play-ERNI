// interface WordPuzzle { ... }, interface SudokuPuzzle { ... }, interface DailyPuzzleResponse { ... }, interface Submission { ... }, interface PuzzleAttempt { ... }.
import type { LucideIcon } from "lucide-react";

export interface WordPuzzle {
  id: number;
  solution_word: string;
}

export interface SudokuPuzzle {
  id: number;
  puzzle_string: string;
  solution_string: string;
  difficulty: "EASY" | "HARD";
}

export interface SudokuCell {
  value: number | null;
  isGiven: boolean;
  isError: boolean;
  notes: number[];
}

export interface ErnigramPuzzle {
  id: number;
  solution_phrase: string;
  clue: string;
}

export interface DailyPuzzleResponse {
  date: string;
  wordle: WordPuzzle;
  sudoku: SudokuPuzzle;
  ernigram: ErnigramPuzzle;
}

export interface SubmissionData {
  puzzle_id: number;
  puzzle_type: "wordle" | "sudoku" | "ernigram";
  time_taken_ms: number;
  tries: number;
}

export interface Submission {
  id: number; // Unique ID for the submission
  user_id: number; // ID of the user who submitted
  puzzle_type: "wordle" | "sudoku" | "ernigram"; // Type of puzzle
  puzzle_id: number; // ID of the specific puzzle instance
  points_awarded: number; // Score calculated by the backend
  time_taken_ms: number; // Time spent on the puzzle
  tries: number; // Number of attempts/guesses
  created_at: string; // ISO 8601 timestamp string when submitted
}

export type KeyStatus = "correct" | "present" | "absent" | "default";

export interface WordleProgress {
  guesses: string[];
  currentRow: number;
  letterStatuses: Record<string, KeyStatus>;
  isGameOver: boolean;
}

export interface ErnigramProgress {
  guessedLetters: string[];
  attemptsLeft: number;
  isGameOver: boolean;
}

export interface PuzzleAttemptData {
  puzzle_id: number;
  puzzle_type: "wordle" | "sudoku" | "ernigram";
  progress_data: WordleProgress | SudokuCell[][] | ErnigramProgress;
  time_spent_ms: number;
}

export interface PuzzleAttemptResponse extends PuzzleAttemptData {
  id: number;
  user_id: number;
  last_saved: string;
}

export interface GameCardData {
  title: string;
  subtitle: string;
  bgColor: string; // Tailwind bg class (e.g., "bg-emerald-500")
  shadowColor: string; // Tailwind shadow class (e.g., "shadow-emerald-900")
  IconComponent: LucideIcon; // Use LucideIcon type
  path: string; // React Router path
}
