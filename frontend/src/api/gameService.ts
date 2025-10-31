import { mockApiCall } from "./api";
import { API_URL } from "./authService";
import { MOCK_PUZZLES, MOCK_TODAY_SUBMISSIONS } from "../data/_mockData";
import type { DailyPuzzleResponse, SubmissionData, PuzzleAttemptData, PuzzleAttemptResponse, Submission } from "../types/game";
import { getCookie } from './authService';

// --- THIS IS THE FIX ---
// Use an object to store separate save slots for each game type
const MOCK_SAVE_SLOTS: {
  wordle?: PuzzleAttemptResponse;
  sudoku?: PuzzleAttemptResponse;
  ernigram?: PuzzleAttemptResponse;
} = {};
// --- END FIX ---

const MOCK_MODE=false
// console.log('[gameService] Module loaded. Initial MOCK_SAVE_SLOTS:', JSON.stringify(MOCK_SAVE_SLOTS));


// Saves the user's progress *to the correct slot*
export const saveProgress = (
  data: PuzzleAttemptData, 
  dailyPuzzleDate: string, 
  puzzleId: string
): Promise<PuzzleAttemptResponse> => {
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

  const modelName = `${data.puzzle_type}puzzle`;
  const url = `${API_URL}/api/gameplay/save/${dailyPuzzleDate}/${modelName}/${puzzleId}/`;
  const csrfToken = getCookie("csrftoken");

  if (!csrfToken) {
        return Promise.reject(new Error("CSRF token not found. Cannot save progress."));
  }

  const payload = {
        progress_data: data.progress_data,
        time_spent_ms: data.time_spent_ms,
        difficulty: data.difficulty || "EASY", // Ensure difficulty is sent
  };

  return fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(payload),
    })
    .then(async response => {
        const responseData = await response.json();
        if (response.status === 403) {
            // Handle Forbidden limits exceeded response
            throw new Error(responseData.error || "Game limits exceeded.");
        }
        if (!response.ok) {
            throw new Error(responseData.error || `Failed to save progress: ${response.statusText}`);
        }
        
        // Success: Return a structured response (must match the expected type)
        return {
            ...data, // Include incoming data
            id: null, // Placeholder since ID isn't returned from your view
            user_id: null, // Placeholder
            last_saved: responseData.last_saved, // Get the fresh timestamp
        } as PuzzleAttemptResponse;
    })
    .catch(error => {
        console.error("[saveProgress] Fetch error:", error);
        throw error;
    });
};

// Gets the user's saved game *for the specific type*
export const getSavedAttempt = (
  currentGameType: PuzzleAttemptData["puzzle_type"], 
  dailyPuzzleDate: string | null, 
  puzzleId: string
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
  // --- REAL API CALL (Connects to GetProgressView) ---
    const modelName = `${currentGameType}puzzle`; // e.g., 'ernigrampuzzle'
    const url = `${API_URL}/api/gameplay/progress/${dailyPuzzleDate}/${modelName}/${puzzleId}/`;

    return fetch(url, {
        method: 'GET',
        credentials: 'include', // Ensures session cookie is sent for @login_required
    })
    .then(async response => {
        const data = await response.json();

        // 400s or other errors should be caught
        if (!response.ok && response.status !== 200) { 
            throw new Error(data.error || `Failed to retrieve progress: ${response.statusText}`);
        }
        
        // Handle the case where the backend returns 200 with "exists: false" (New Game)
        if (!data.exists) {
            return null;
        }

        // Map the successful backend response to the frontend's expected type
        return {
            // Note: If your PuzzleAttemptResponse requires 'id' or 'user_id', 
            // you may need to adjust the backend response in GetProgressView.
            puzzle_type: currentGameType,
            progress_data: data.progress_data,
            time_spent_ms: data.time_spent_ms,
            last_saved: data.last_saved,
            id: null, user_id: null // Placeholder/dummy data if required by type
        } as PuzzleAttemptResponse; 
    })
    .catch(error => {
        console.error("[getSavedAttempt] Fetch error:", error);
        // On error, treat it as a new game state to prevent app crash
        return null; 
    });
};



// Submits a completed puzzle and clears the *correct* slot
export const submitPuzzle = async (
    data: SubmissionData, 
    dailyPuzzleDate: string, // <-- Needed for URL
    puzzleId: string       // <-- Needed for URL
): Promise<{ score: number; submissionId: number | null }> => {
  if (MOCK_MODE) {
    // ... (mock logic remains the same, ensure it returns submissionId) ...
    const mockSubmissionId = Math.floor(Math.random() * 1000) + 500;
    let score = 500; // Mock score
    return mockApiCall({ score: score, submissionId: mockSubmissionId });
  }

  // --- REAL API CALL ---
  try {
    const csrfToken = getCookie("csrftoken");
    if (!csrfToken) {
      throw new Error("CSRF token not found. Cannot submit puzzle.");
    }

    // This endpoint must be created on your backend (e.g., gameplay/urls.py)
    const modelName = `${data.puzzle_type}puzzle`;
    const url = `${API_URL}/api/gameplay/submit/${dailyPuzzleDate}/${modelName}/${puzzleId}/`;


    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      // Send the full SubmissionData object, including difficulty
      body: JSON.stringify(data),
    });


    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to submit puzzle: ${response.statusText}`);
    }

    // Expect backend to return { score: number, submissionId: number }
    return await response.json();
  } catch (error) {
    console.error("[submitPuzzle] Fetch error:", error);
    throw error;
  }
  // ---
};

// --- Daily Puzzles (Unchanged) ---
export const getDailyPuzzles = async (): Promise<DailyPuzzleResponse> => {
  if (MOCK_MODE) {
    console.log("Mock: Fetching daily puzzles...");
    return mockApiCall(MOCK_PUZZLES);
  }

  // --- REAL API CALL ---
  try {
    const response = await fetch(`${API_URL}/api/games/daily/`, { // Matches backend games/urls.py
      method: 'GET',
      credentials: 'include', // Send session cookie
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error(`[getDailyPuzzles] API request failed with status ${response.status}:`, errData);
      throw new Error(`Failed to fetch daily puzzles: ${errData.detail || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('[getDailyPuzzles] Fetch error:', error);
    throw error;
  }
  // ---
};

// Assuming MAX_ATTEMPTS is defined somewhere, if not add:
const MAX_ATTEMPTS = 6;

export const getTodaySubmissions = (): Promise<Submission[]> => {
  if (MOCK_MODE) {
    console.log("Mock: Fetching today's submissions...");
    // In a real app, this would filter by user and date on the backend
    // For mock, just return the predefined list for the mock user
    return mockApiCall(MOCK_TODAY_SUBMISSIONS);
  }
  // Real call: return api.get('/api/submissions/today/'); // Example real endpoint
  return new Promise(() => {});
};
