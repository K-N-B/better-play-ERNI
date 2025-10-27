import { mockApiCall} from './api'; // Import helpers
import { getCookie, API_URL } from './authService'
import { MOCK_REWARDS } from '../data/_mockData'; // Adjust path
import type { RewardItem, ClaimResponse } from '../types';

const MOCK_MODE = false;
/**
 * Fetches the list of available rewards from the real backend.
 */
export const getRewards = async (): Promise<RewardItem[]> => {
  if (MOCK_MODE) {
    console.log("Mock: Fetching rewards...");
    return mockApiCall([...MOCK_REWARDS]);
  }

  // --- REAL API CALL ---
  try {
    const response = await fetch(`${API_URL}/api/shop/rewards/`, {
      method: 'GET',
      credentials: 'include', // Send session cookie
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch rewards: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('[getRewards] Fetch error:', error);
    throw error;
  }
  // ---
};

/**
 * Attempts to claim a specific reward for the user from the real backend.
 * @param {string | number} rewardId - The ID of the reward to claim.
 * @returns {Promise<ClaimResponse>} - Response indicating success/failure.
 */
export const claimReward = async (rewardId: string | number): Promise<ClaimResponse> => {
  // We no longer pass currentUserPoints; the backend handles this.
  if (MOCK_MODE) {
    // ... (Mock logic can stay for fallback testing) ...
    console.log(`Mock: Claiming reward ${rewardId}`);
    const reward = MOCK_REWARDS.find(r => r.id === rewardId);
    if (reward && 1000 >= reward.cost) { // Hardcoded 1000 points for mock
        return mockApiCall({ success: true, message: `Mock claimed ${reward.name}!`, remainingPoints: 1000 - reward.cost });
    }
    return mockApiCall({ success: false, message: "Mock: Not enough points." });
  }

  // --- REAL API CALL ---
  try {
    const csrfToken = getCookie('csrftoken');
    if (!csrfToken) {
      throw new Error("CSRF token not found. Cannot claim reward.");
    }

    const response = await fetch(`${API_URL}/api/shop/claim/${rewardId}/`, { // Use correct URL
       method: 'POST',
       credentials: 'include', // Send session cookie
       headers: {
         'Content-Type': 'application/json',
         'X-CSRFToken': csrfToken, // <-- Include CSRF token
       },
       // No body is needed unless your view requires one
       // body: JSON.stringify({}), 
    });

    const data: ClaimResponse = await response.json(); // Get response from backend

    if (!response.ok) {
      // Throw an error with the message from the backend
      throw new Error(data.message || `Failed to claim reward: ${response.statusText}`);
    }

    // Backend should return { success: true, message: "...", remainingPoints: ... }
    return data; 

  } catch (error) {
    console.error('[claimReward] Fetch error:', error);
    throw error; // Re-throw to be caught by the component
  }
  // ---
};