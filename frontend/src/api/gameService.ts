import { MOCK_MODE, mockApiCall } from './api';
import { MOCK_PUZZLES } from '../data/_mockData';
import type {
  DailyPuzzleResponse,
  SubmissionData,
  PuzzleAttemptData,
  PuzzleAttemptResponse,
} from '../types/game';

// --- THIS IS THE FIX ---
// Use an object to store separate save slots for each game type
const MOCK_SAVE_SLOTS: {
  wordle?: PuzzleAttemptResponse;
  sudoku?: PuzzleAttemptResponse;
  ernigram?: PuzzleAttemptResponse;
} = {};
// --- END FIX ---

// console.log('[gameService] Module loaded. Initial MOCK_SAVE_SLOTS:', JSON.stringify(MOCK_SAVE_SLOTS));

// Gets the user's saved game *for the specific type*
export const getSavedAttempt = (
  currentGameType: PuzzleAttemptData['puzzle_type']
): Promise<PuzzleAttemptResponse | null> => {
  if (MOCK_MODE) {
    // console.log(`%c[getSavedAttempt] Fetching for ${currentGameType}...`, 'color: blue');
    // --- DEBUG LOGGING ---
    // console.log(`%c[getSavedAttempt] Current MOCK_SAVE_SLOTS state: ${JSON.stringify(MOCK_SAVE_SLOTS)}`, 'color: blue');
    // --- END DEBUG ---
    const savedGame = MOCK_SAVE_SLOTS[currentGameType];
    if (savedGame) {
      // console.log(`%c[getSavedAttempt] Found saved ${currentGameType}`, 'color: green');
      return mockApiCall(savedGame);
    } else {
      // console.log(`%c[getSavedAttempt] No saved game found for ${currentGameType}`, 'color: orange');
      return mockApiCall(null);
    }
  }
  return new Promise(() => {});
};


// Saves the user's progress *to the correct slot*
export const saveProgress = (data: PuzzleAttemptData): Promise<PuzzleAttemptResponse> => {
  if (MOCK_MODE) {
    // console.log(`%c[saveProgress] Saving progress for ${data.puzzle_type}...`, 'color: purple', data);
    const savedGame: PuzzleAttemptResponse = {
      ...data,
      id: Math.floor(Math.random() * 1000),
      user_id: 1,
      last_saved: new Date().toISOString(),
    };
    MOCK_SAVE_SLOTS[data.puzzle_type] = savedGame;
    // --- DEBUG LOGGING ---
    // console.log(`%c[saveProgress] MOCK_SAVE_SLOTS updated: ${JSON.stringify(MOCK_SAVE_SLOTS)}`, 'color: purple; font-weight: bold');
    // --- END DEBUG ---
    return mockApiCall(savedGame);
  }
  return new Promise(() => {});
};


// Submits a completed puzzle and clears the *correct* slot
export const submitPuzzle = (data: SubmissionData): Promise<{ score: number }> => {
  if (MOCK_MODE) {
    // console.log(`%c[submitPuzzle] Submitting ${data.puzzle_type}...`, 'color: red', data);

    if (MOCK_SAVE_SLOTS[data.puzzle_type]) {
      // console.log(`%c[submitPuzzle] Clearing saved game for ${data.puzzle_type}`, 'color: red');
      delete MOCK_SAVE_SLOTS[data.puzzle_type];
      // --- DEBUG LOGGING ---
      // console.log(`%c[submitPuzzle] MOCK_SAVE_SLOTS after clear: ${JSON.stringify(MOCK_SAVE_SLOTS)}`, 'color: red; font-weight: bold');
      // --- END DEBUG ---
    } else {
      //  console.log(`%c[submitPuzzle] No saved game found for ${data.puzzle_type} to clear.`, 'color: orange');
    }

    // Calculate score
    let score = 500;
    // ... (score calculation logic remains the same) ...
     if (data.puzzle_type === 'wordle') {
      score = Math.max(0, (7 - data.tries) * 100);
    } else if (data.puzzle_type === 'ernigram') {
      score = Math.max(0, (MAX_ATTEMPTS - data.tries + 1) * 50 + (100 - Math.floor(data.time_taken_ms / 1000 / 2))); // Example scoring
    } else if (data.puzzle_type === 'sudoku') {
        score = Math.max(50, 1000 - Math.floor(data.time_taken_ms / 1000));
    }

    return mockApiCall({ score: score });
  }
  return new Promise(() => {});
};


// --- Daily Puzzles (Unchanged) ---
export const getDailyPuzzles = (): Promise<DailyPuzzleResponse> => {
  if (MOCK_MODE) {
    return mockApiCall(MOCK_PUZZLES);
  }
  return new Promise(() => {});
};

// Assuming MAX_ATTEMPTS is defined somewhere, if not add:
const MAX_ATTEMPTS = 6;