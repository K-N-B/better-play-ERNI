import type { LucideIcon } from 'lucide-react';
// Assuming Difficulty is defined in gamePage.tsx, or move it here
export type Difficulty = "easy" | "hard";

// --- PUZZLE TYPES (from games/serializers.py) ---
export interface WordlePuzzle {
  id: number;
  solution_word: string;
  word_length: number; // From your serializer
  date_to_be_used: string;
}

export interface SudokuPuzzle {
  id: number; // Add ID, it's good practice
  date_to_be_used: string;
  solution_string: string;
  puzzle_string_easy: string;
  puzzle_string_hard: string;
}

export interface ErnigramPuzzle {
  id: number;
  solution_phrase: string;
  clue: string;
  employee_image: string | null;
  date_to_be_used: string;
}

// --- API RESPONSE (from games/serializers.py DailyPuzzleSerializer) ---
export interface DailyPuzzleResponse {
  date: string;
  wordle_easy: WordlePuzzle | null; // Can be null if admin doesn't set one
  wordle_hard: WordlePuzzle | null; // Can be null
  sudoku: SudokuPuzzle | null;
  ernigram: ErnigramPuzzle | null;
}

// --- SUBMISSION DATA (from gameplay/models.py Submission) ---
export interface SubmissionData {
  puzzle_id: number;
  puzzle_type: 'wordle' | 'sudoku' | 'ernigram';
  difficulty: Difficulty; // <-- Added difficulty
  time_taken_ms: number;
  tries: number;
}

export interface Submission {
  id: number;
  user_id: number;
  puzzle_type: 'wordle' | 'sudoku' | 'ernigram';
  puzzle_id: number;
  points_awarded: number;
  time_taken_ms: number;
  tries: number;
  created_at: string;
  difficulty: Difficulty; // <-- Added difficulty
}

// --- SAVE/RESUME & UI TYPES (Keep as is) ---
export type KeyStatus = 'correct' | 'present' | 'absent' | 'default';

export interface WordleProgress {
  guesses: string[];
  currentRow: number;
  letterStatuses: Record<string, KeyStatus>;
  isGameOver: boolean;
}

export interface SudokuCell {
  value: number | null;
  isGiven: boolean;
  isError: boolean;
  notes: number[];
}

export interface ErnigramProgress {
  guessedLetters: string[];
  attemptsLeft: number;
  isGameOver: boolean;
}

export interface PuzzleAttemptData {
  puzzle_id: number;
  puzzle_type: 'wordle' | 'sudoku' | 'ernigram';
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
  bgColor: string;
  shadowColor: string;
  IconComponent: LucideIcon;
  path: string;
}