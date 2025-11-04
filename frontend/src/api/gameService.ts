// src/api/gameService.ts (FINAL COMPLETE VERSION)
import type {
  DailyPuzzleResponse,
  SubmissionData,
  PuzzleAttemptData,
  PuzzleAttemptResponse,
  Submission,
  SubmissionResult, // ✅ Import complete type
} from '../types/game';

const API_BASE_URL = 'http://localhost:8000/api';

// ✅ Utility: Get CSRF token
function getCookie(name: string): string | null {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// ✅ Fetch daily puzzles
export const getDailyPuzzles = async (): Promise<DailyPuzzleResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/games/daily/`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
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

// ✅ Fetch saved attempt for a given puzzle
export const getSavedAttempt = async (
  puzzleType: string,
  dailyPuzzleDate: string,
  puzzleId: string
): Promise<PuzzleAttemptResponse | null> => {
  try {
    const url = `${API_BASE_URL}/gameplay/progress/${dailyPuzzleDate}/${puzzleType}puzzle/${puzzleId}/`;
    console.log('[getSavedAttempt] Fetching:', url);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('[getSavedAttempt] No saved attempt found (404)');
        return null;
      }
      throw new Error(`Failed to fetch saved attempt: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[getSavedAttempt] Found saved attempt:', data);
    return data;
  } catch (error) {
    console.error('[getSavedAttempt] Error:', error);
    return null;
  }
};

// ✅ Save puzzle progress
export const saveProgress = async (
  data: PuzzleAttemptData,
  dailyPuzzleDate: string,
  puzzleId: number
): Promise<PuzzleAttemptResponse> => {
  try {
    const csrfToken = getCookie('csrftoken');
    const url = `${API_BASE_URL}/gameplay/save/${dailyPuzzleDate}/${data.puzzle_type}puzzle/${puzzleId}/`;
    console.log('[saveProgress] Saving to:', url);

    const response = await fetch(url, {
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
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[saveProgress] Error response:', errorData);
      throw new Error(errorData.error || `Failed to save progress: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[saveProgress] Success:', result);
    return result;
  } catch (error) {
    console.error('[saveProgress] Error:', error);
    throw error;
  }
};

// ✅ Submit puzzle and return full SubmissionResult
export const submitPuzzle = async (
  data: SubmissionData,
  dailyPuzzleDate: string,
  puzzleId: number
): Promise<SubmissionResult> => {
  try {
    const csrfToken = getCookie('csrftoken');
    const url = `${API_BASE_URL}/gameplay/submit/${dailyPuzzleDate}/${data.puzzle_type}puzzle/${puzzleId}/`;

    console.log('[submitPuzzle] Submitting to:', url);
    console.log('[submitPuzzle] Data:', { difficulty: data.difficulty });

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || '',
      },
      body: JSON.stringify({ difficulty: data.difficulty }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[submitPuzzle] Error response:', errorData);
      throw new Error(errorData.error || `Failed to submit puzzle: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[submitPuzzle] Success:', result);

    // ✅ Return a full SubmissionResult object
    return {
      score: result.points_awarded || 0,
      submissionId: result.submission_id || null,
      currentStreak: result.current_streak || 0,
      maxStreak: result.max_streak || 0,
      streakUpdatedToday: result.streak_updated_today || false,
      message: result.message || '',
    };
  } catch (error) {
    console.error('[submitPuzzle] Error:', error);
    throw error;
  }
};

// ✅ Fetch today's submissions
export const getTodaySubmissions = async (): Promise<Submission[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/gameplay/submissions/today/`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch submissions: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[getTodaySubmissions] Error:', error);
    return [];
  }
};

// ✅ Check if a submission already exists
export const checkSubmissionExists = async (
  puzzleType: string,
  dailyPuzzleDate: string,
  puzzleId: number
): Promise<{ hasSubmitted: boolean; score?: number; submittedAt?: string }> => {
  try {
    const url = `${API_BASE_URL}/gameplay/check-submission/${dailyPuzzleDate}/${puzzleType}puzzle/${puzzleId}/`;
    console.log('[checkSubmissionExists] Checking:', url);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { hasSubmitted: false };
      }
      throw new Error(`Failed to check submission: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[checkSubmissionExists] Error:', error);
    return { hasSubmitted: false };
  }
};
