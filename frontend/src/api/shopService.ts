import { getCookie, API_URL } from "./authService";
import type { RewardItem, ClaimResponse, ClaimedReward } from "../types";

/**
 * Fetches the list of available rewards from the real backend.
 */
export const getRewards = async (): Promise<RewardItem[]> => {
  // --- REAL API CALL ---
  try {
    const response = await fetch(`${API_URL}/api/shop/rewards/`, {
      method: "GET",
      credentials: "include", // Send session cookie
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch rewards: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("[getRewards] Fetch error:", error);
    throw error;
  }
  // ---
};

/**
 * Fetches the user's history of claimed rewards.
 */
export const getClaimedRewards = async (): Promise<ClaimedReward[]> => {
  // --- REAL API CALL ---
  try {
    // This assumes your backend endpoint is /api/shop/claims/
    const response = await fetch(`${API_URL}/api/shop/claims/`, {
      method: "GET",
      credentials: "include", // Send session cookie
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch claimed rewards: ${response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error("[getClaimedRewards] Fetch error:", error);
    throw error;
  }
  // ---
};

/**
 * Attempts to claim a specific reward for the user from the real backend.
 * @param {string | number} rewardId - The ID of the reward to claim.
 * @returns {Promise<ClaimResponse>} - Response indicating success/failure.
 */
export const claimReward = async (
  rewardId: string | number
): Promise<ClaimResponse> => {
  // --- REAL API CALL ---
  try {
    const csrfToken = getCookie("csrftoken");
    if (!csrfToken) {
      throw new Error("CSRF token not found. Cannot claim reward.");
    }

    const response = await fetch(`${API_URL}/api/shop/claim/${rewardId}/`, {
      // Use correct URL
      method: "POST",
      credentials: "include", // Send session cookie
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken, // <-- Include CSRF token
      },
      // No body is needed unless your view requires one
      // body: JSON.stringify({}),
    });

    const data: ClaimResponse = await response.json(); // Get response from backend

    if (!response.ok) {
      // Throw an error with the message from the backend
      throw new Error(
        data.message || `Failed to claim reward: ${response.statusText}`
      );
    }

    // Backend should return { success: true, message: "...", remainingPoints: ... }
    return data;
  } catch (error) {
    console.error("[claimReward] Fetch error:", error);
    throw error; // Re-throw to be caught by the component
  }
  // ---
};
