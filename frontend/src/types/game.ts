/* eslint-disable prettier/prettier */
 
// src/types/game.ts - FIXED VERSION

import type { LucideIcon } from 'lucide-react';

export type Difficulty = 'easy' | 'hard';

// --- PUZZLE TYPES ---
export interface WordlePuzzle {
  id: number;
  solution_word: string;
  word_length: number;
  date_to_be_used: string;
}

export interface SudokuPuzzle {
  id: number;
  date_to_be_used: string;
  solution_string: string;
  puzzle_string_easy: string;
  puzzle_string_hard: string;
}

export interface ErnigramPuzzle {
  id: number;
  solution_phrase: string;
  clue: string;
  employee_image_url: string | 'None';
  date_to_be_used: string;
}

// --- API RESPONSE ---
export interface DailyPuzzleResponse {
  date: string;
  wordle_easy: WordlePuzzle | null;
  wordle_hard: WordlePuzzle | null;
  sudoku: SudokuPuzzle | null;
  ernigram: ErnigramPuzzle | null;
}

// --- SUBMISSION DATA ---
export interface SubmissionData {
  puzzle_id: number;
  puzzle_type: 'wordle' | 'sudoku' | 'ernigram';
  difficulty: Difficulty;
  time_taken_ms: number;
  tries: number;
}

export interface Submission {
  id: number;
  user_id: number;
  puzzle_type: 'wordlepuzzle' | 'sudoku' | 'ernigram';
  puzzle_id: number;
  points_awarded: number;
  time_taken_ms: number;
  tries: number;
  created_at: string;
  difficulty: Difficulty;
}

// ✅ FIX 1: Complete SubmissionResult type with all required fields
export interface SubmissionResult {
  score: number;
  submissionId: number | null;
  currentStreak: number;
  maxStreak: number;
  streakUpdatedToday: boolean;
  message: string;
}

// --- PROGRESS TYPES ---
export type KeyStatus = 'correct' | 'present' | 'absent' | 'default';

// ✅ FIX 2: Updated WordleProgress status to include 'LOST'
export interface WordleProgress {
  guesses: string[];
  currentRow: number;
  letterStatuses: Record<string, KeyStatus>;
  isGameOver: boolean;
  status?: 'ACTIVE' | 'SOLVED' | 'LOST'; // ✅ Added 'LOST'
}

export interface SudokuCell {
  value: number | null;
  isGiven: boolean;
  isError: boolean;
  notes: number[];
}

// ✅ FIX 3: Updated ErnigramProgress to include status field
export interface ErnigramProgress {
  guessedLetters: string[];
  attemptsLeft: number;
  isGameOver: boolean;
  misses?: number; // ✅ Added optional misses
  status?: 'ACTIVE' | 'SOLVED' | 'LOST'; // ✅ Added status
}

// ✅ FIX 4: Updated SudokuProgress type
export interface SudokuProgress {
  grid: SudokuCell[][];
  final_grid?: string;
  hints_used: number;
  isGameOver: boolean;
  status?: 'ACTIVE' | 'SOLVED' | 'LOST'; // ✅ Added status
}

export interface PuzzleAttemptData {
  puzzle_id: number;
  puzzle_type: 'wordle' | 'sudoku' | 'ernigram';
  progress_data: any;
  time_spent_ms: number;
  difficulty: Difficulty;
  hints_used?: number;
}

export interface PuzzleAttemptResponse extends PuzzleAttemptData {
  id: number | null;
  user_id: number | null;
  last_saved: string;
  puzzle_id: number;
  puzzle_type: 'wordle' | 'sudoku' | 'ernigram';
  time_spent_ms: number;
  progress_data: any;
}

export interface GameCardData {
  title: string;
  subtitle: string;
  bgColor: string;
  shadowColor: string;
  IconComponent: LucideIcon;
  path: string;
}
