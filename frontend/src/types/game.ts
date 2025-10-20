// interface WordPuzzle { ... }, interface SudokuPuzzle { ... }, interface DailyPuzzleResponse { ... }, interface Submission { ... }, interface PuzzleAttempt { ... }.

export interface WordlePuzzle {
    id: number;
    solution_word: string;
}

export interface SudokuPuzzle {
    id: number;
    puzzle_string: string;
    solution_string: string;
    difficulty: 'EASY' | 'HARD'
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
    wordle: WordlePuzzle;
    sudoku: SudokuPuzzle;
    ernigram: ErnigramPuzzle;
}

export interface SubmissionData {
    puzzle_id: number;
    puzzle_type: 'wordle' | 'sudoku' | 'ernigram';
    time_taken_ms: number;
    tries: number;
}

export type KeyStatus = 'correct' | 'present' | 'absent' | 'default';

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
    puzzle_type: 'wordle' | 'sudoku' | 'ernigram';
    progress_data: WordleProgress | SudokuCell[][] | ErnigramProgress;
    time_spent_ms: number;
}

export interface PuzzleAttemptResponse extends PuzzleAttemptData {
    id: number;
    user_id: number;
    last_saved: string;
}

