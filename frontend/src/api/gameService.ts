// frontend/src/api/gameService.ts
import type {
  DailyPuzzleResponse,
  SubmissionData,
  PuzzleAttemptData,
  PuzzleAttemptResponse,
  Submission,
} from '../types/game';

const API_BASE_URL = 'http://localhost:8000/api';

// ✅ CRITICAL: Helper to get CSRF token
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

/**
 * Get daily puzzles for all games
 * GET /api/games/daily/
 */
export const getDailyPuzzles = async (): Promise<DailyPuzzleResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/games/daily/`, {
      method: 'GET',
      credentials: 'include', // ✅ Send session cookie
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
 * Get saved attempt for a specific game
 * GET /api/gameplay/progress/{daily_puzzle_date}/{puzzle_type}/{puzzle_id}/
 */
export const getSavedAttempt = async (
  puzzleType: string,
  dailyPuzzleDate: string,
  puzzleId: string
): Promise<PuzzleAttemptResponse | null> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/gameplay/progress/${dailyPuzzleDate}/${puzzleType}puzzle/${puzzleId}/`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No saved attempt found
      }
      throw new Error(`Failed to fetch saved attempt: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[getSavedAttempt] Error:', error);
    return null;
  }
};

/**
 * Save progress for a game
 * POST /api/gameplay/save/{daily_puzzle_date}/{puzzle_type}/{puzzle_id}/
 */
export const saveProgress = async (
  data: PuzzleAttemptData,
  dailyPuzzleDate: string,
  puzzleId: string
): Promise<PuzzleAttemptResponse> => {
  try {
    const csrfToken = getCookie('csrftoken');
    
    const response = await fetch(
      `${API_BASE_URL}/gameplay/save/${dailyPuzzleDate}/${data.puzzle_type}puzzle/${puzzleId}/`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        },
        body: JSON.stringify({
          progress_data: data.progress_data,
          time_spent_ms: data.time_spent_ms,
          difficulty: data.difficulty,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to save progress: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[saveProgress] Error:', error);
    throw error;
  }
};

/**
 * Submit completed puzzle
 * POST /api/gameplay/submit/{daily_puzzle_date}/{puzzle_type}/{puzzle_id}/
 */
export const submitPuzzle = async (
  data: SubmissionData,
  dailyPuzzleDate: string,
  puzzleId: string
): Promise<{ score: number, submissionId: number | null }> => {
  try {
    const csrfToken = getCookie('csrftoken');
    
    const response = await fetch(
      `${API_BASE_URL}/gameplay/submit/${dailyPuzzleDate}/${data.puzzle_type}puzzle/${puzzleId}/`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        },
        body: JSON.stringify({
          difficulty: data.difficulty,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to submit puzzle: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      score: result.points_awarded,
      submissionId: result.submission_id || null,
    };
  } catch (error) {
    console.error('[submitPuzzle] Error:', error);
    throw error;
  }
};

/**
 * Get today's submissions for the current user
 */
export const getTodaySubmissions = async (): Promise<Submission[]> => {
  // For now, this info comes from the daily puzzles endpoint
  // The backend returns "already_played" status if submitted
  return [];
};