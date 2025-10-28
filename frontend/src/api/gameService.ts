// frontend/src/api/gameService.ts
import { MOCK_MODE, mockApiCall } from './api';
import { MOCK_PUZZLES, MOCK_TODAY_SUBMISSIONS } from '../data/_mockData';
import type {
  DailyPuzzleResponse,
  SubmissionData,
  PuzzleAttemptData,
  PuzzleAttemptResponse,
  Submission,
} from '../types/game';

const API_BASE_URL = 'http://localhost:8000/api';

// Helper function to get CSRF token from cookies
function getCookie(name: string): string | null {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// --- Mock storage for saved games (only used in mock mode) ---
const MOCK_SAVE_SLOTS: {
  wordle?: PuzzleAttemptResponse;
  sudoku?: PuzzleAttemptResponse;
  ernigram?: PuzzleAttemptResponse;
} = {};

/**
 * Get daily puzzles for all games
 * GET /api/games/daily/
 */
export const getDailyPuzzles = async (): Promise<DailyPuzzleResponse> => {
  if (MOCK_MODE) {
    return mockApiCall(MOCK_PUZZLES);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/games/daily/`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch daily puzzles: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[getDailyPuzzles] Error:', error);
    throw error;
  }
};

/**
 * Get saved attempt for a specific game type
 * GET /api/wordle/today/ (or similar for other games)
 */
export const getSavedAttempt = async (
  currentGameType: PuzzleAttemptData['puzzle_type']
): Promise<PuzzleAttemptResponse | null> => {
  if (MOCK_MODE) {
    const savedGame = MOCK_SAVE_SLOTS[currentGameType];
    return mockApiCall(savedGame || null);
  }

  // Real API call - saved attempts come from the game endpoint
  // This is handled by getDailyPuzzles response which includes saved_attempt
  return null; // Will be retrieved via getDailyPuzzles
};

/**
 * Save progress for a game
 * POST /api/wordle/save-progress/ (or similar)
 */
export const saveProgress = async (data: PuzzleAttemptData): Promise<PuzzleAttemptResponse> => {
  if (MOCK_MODE) {
    const savedGame: PuzzleAttemptResponse = {
      ...data,
      id: Math.floor(Math.random() * 1000),
      user_id: 1,
      last_saved: new Date().toISOString(),
    };
    MOCK_SAVE_SLOTS[data.puzzle_type] = savedGame;
    return mockApiCall(savedGame);
  }

  try {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${API_BASE_URL}/wordle/save-progress/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || '',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to save progress: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[saveProgress] Error:', error);
    throw error;
  }
};

/**
 * Submit completed puzzle
 * POST /api/wordle/submit/
 */
export const submitPuzzle = async (data: SubmissionData): Promise<{ score: number, submissionId: number | null }> => {
  if (MOCK_MODE) {
    if (MOCK_SAVE_SLOTS[data.puzzle_type]) {
      delete MOCK_SAVE_SLOTS[data.puzzle_type];
    }

    let score = 500;
    if (data.puzzle_type === 'wordle') {
      score = Math.max(0, (7 - data.tries) * 100);
    }

    const mockSubmissionId = Math.floor(Math.random() * 1000) + 500;
    return mockApiCall({ score: score, submissionId: mockSubmissionId });
  }

  try {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${API_BASE_URL}/wordle/submit/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || '',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to submit puzzle: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      score: result.points_awarded,
      submissionId: result.submission?.id || null,
    };
  } catch (error) {
    console.error('[submitPuzzle] Error:', error);
    throw error;
  }
};

/**
 * Get today's submissions for the current user
 * Used to check which games have been played today
 */
export const getTodaySubmissions = async (): Promise<Submission[]> => {
  if (MOCK_MODE) {
    console.log("Mock: Fetching today's submissions...");
    return mockApiCall(MOCK_TODAY_SUBMISSIONS);
  }

  // For now, this info comes from the daily puzzles endpoint
  // The backend returns "already_played" status if submitted
  return [];
};