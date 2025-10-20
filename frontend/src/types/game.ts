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