// Functions for playing the games.
// What you need to do:
// getDailyPuzzles(): Calls GET /api/daily-puzzles/today/.
// getSavedAttempt(): Calls GET /api/puzzle-attempt/.
// saveProgress(data: PuzzleAttempt): Calls POST /api/puzzle-attempt/save.
// submitPuzzle(data: SubmissionData): Calls POST /api/submit-puzzle/.

import { MOCK_MODE, mockApiCall } from './api';
import { MOCK_PUZZLES } from '../data/_mockData';
import type { DailyPuzzleResponse, SubmissionData } from '../types/game';

// Gets all 3 puzzles for the day
export const getDailyPuzzles = (): Promise<DailyPuzzleResponse> => {
  if (MOCK_MODE) {
    return mockApiCall(MOCK_PUZZLES);
  }
  // !! Real call: return api.get('/api/daily-puzzles/today/');
  return new Promise(() => {});
};

// Submits a completed puzzle
export const submitPuzzle = (data: SubmissionData): Promise<{ score: number }> => {
  if (MOCK_MODE) {
    console.log('Mock Puzzle Submission:', data);
    // Return a fake score based on tries
    let score = 500;
    if (data.puzzle_type === 'wordle') {
      score = (7 - data.tries) * 100; // 6 tries = 100, 1 try = 600
    }
    return mockApiCall({ score: score });
  }
  // !! Real call: return api.post('/api/submit-puzzle/', data);
  return new Promise(() => {});
};