import { MOCK_MODE, mockApiCall, API_BASE_URL } from './api';
import { MOCK_PUZZLES, MOCK_TODAY_SUBMISSIONS } from '../data/_mockData';
import type {
  DailyPuzzleResponse,
  SubmissionData,
  PuzzleAttemptData,
  PuzzleAttemptResponse,
  Submission,
} from '../types/game';

// Store saved progress in memory when in mock mode
const MOCK_SAVE_SLOTS: {
  wordle?: PuzzleAttemptResponse;
  sudoku?: PuzzleAttemptResponse;
  ernigram?: PuzzleAttemptResponse;
} = {};

// ============================================
// GET DAILY PUZZLES
// ============================================
export const getDailyPuzzles = async (difficulty: string = 'easy'): Promise<DailyPuzzleResponse> => {
  if (MOCK_MODE) {
    console.log('[MOCK] Fetching daily puzzles...');
    return mockApiCall(MOCK_PUZZLES);
  }
  
  const response = await fetch(`${API_BASE_URL}/puzzles/daily/?difficulty=${difficulty}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch daily puzzles');
  }
  
  return response.json();
};

// ============================================
// GET SAVED PROGRESS
// ============================================
export const getSavedAttempt = async (
  puzzleType: 'wordle' | 'sudoku' | 'ernigram'
): Promise<PuzzleAttemptResponse | null> => {
  if (MOCK_MODE) {
    console.log(`[MOCK] Fetching saved progress for ${puzzleType}...`);
    const savedGame = MOCK_SAVE_SLOTS[puzzleType];
    return mockApiCall(savedGame || null);
  }
  
  const response = await fetch(`${API_BASE_URL}/progress/${puzzleType}/`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch saved progress');
  }
  
  // Backend returns null if no saved progress
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

// ============================================
// SAVE PROGRESS (Auto-save every 2s)
// ============================================
export const saveProgress = async (data: PuzzleAttemptData): Promise<PuzzleAttemptResponse> => {
  if (MOCK_MODE) {
    console.log(`[MOCK] Saving progress for ${data.puzzle_type}...`, data);
    const savedGame: PuzzleAttemptResponse = {
      ...data,
      id: Math.floor(Math.random() * 1000),
      user_id: 1,
      last_saved: new Date().toISOString(),
    };
    MOCK_SAVE_SLOTS[data.puzzle_type] = savedGame;
    return mockApiCall(savedGame);
  }
  
  const response = await fetch(`${API_BASE_URL}/progress/save/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save progress');
  }
  
  return response.json();
};

// ============================================
// SUBMIT PUZZLE (Final submission)
// ============================================
export const submitPuzzle = async (data: SubmissionData): Promise<{ score: number }> => {
  if (MOCK_MODE) {
    console.log(`[MOCK] Submitting ${data.puzzle_type}...`, data);
    
    // Clear saved progress
    if (MOCK_SAVE_SLOTS[data.puzzle_type]) {
      delete MOCK_SAVE_SLOTS[data.puzzle_type];
    }
    
    // Calculate mock score
    let score = 100;
    if (data.puzzle_type === 'wordle') {
      score = Math.max(0, (7 - data.tries) * 100);
    } else if (data.puzzle_type === 'ernigram') {
      const MAX_ATTEMPTS = 10;
      score = Math.max(0, (MAX_ATTEMPTS - data.tries + 1) * 50 + (100 - Math.floor(data.time_taken_ms / 1000 / 2)));
    } else if (data.puzzle_type === 'sudoku') {
      score = Math.max(50, 1000 - Math.floor(data.time_taken_ms / 1000));
    }
    
    return mockApiCall({ score });
  }
  
  const response = await fetch(`${API_BASE_URL}/submissions/submit/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit puzzle');
  }
  
  return response.json();
};

// ============================================
// GET TODAY'S SUBMISSIONS
// ============================================
export const getTodaySubmissions = async (): Promise<Submission[]> => {
  if (MOCK_MODE) {
    console.log("[MOCK] Fetching today's submissions...");
    return mockApiCall(MOCK_TODAY_SUBMISSIONS);
  }
  
  const response = await fetch(`${API_BASE_URL}/submissions/today/`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch today's submissions");
  }
  
  return response.json();
};

// ============================================
// GET PUZZLE HINTS (Wordle only)
// ============================================
export const getPuzzleHints = async (puzzleId: number): Promise<{ hint_1: string; hint_2: string; hint_3: string }> => {
  if (MOCK_MODE) {
    console.log(`[MOCK] Fetching hints for puzzle ${puzzleId}...`);
    return mockApiCall({
      hint_1: "This is a common word",
      hint_2: "It starts with 'H'",
      hint_3: "It's a place where people live"
    });
  }
  
  const response = await fetch(`${API_BASE_URL}/puzzles/${puzzleId}/hints/`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch hints');
  }
  
  return response.json();
};