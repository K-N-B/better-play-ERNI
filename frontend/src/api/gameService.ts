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

// Gets the user's saved game *for the specific type*
export const getSavedAttempt = (currentGameType: PuzzleAttemptData["puzzle_type"]): Promise<PuzzleAttemptResponse | null> => {
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
export const submitPuzzle = async (data: SubmissionData): Promise<{ score: number; submissionId: number | null }> => {
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
    const response = await fetch(`${API_URL}/api/submit-puzzle/`, {
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
    const response = await fetch(`${API_URL}/api/games/daily/`, {
      // Matches backend urls.py
      method: "GET",
      credentials: "include", // Send session cookie
      headers: {
        "Content-Type": "application/json",
      },
    });

    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error(`[getDailyPuzzles] API request failed with status ${response.status}:`, errData);
      throw new Error(`Failed to fetch daily puzzles: ${errData.detail || response.statusText}`);
    }
    // } else {
    //   console.log("[getDailyPuzzles] Fetched real data:", await response.json());
    
    // }
    return await response.json();
  } catch (error) {
    console.error("[getDailyPuzzles] Fetch error:", error);
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
