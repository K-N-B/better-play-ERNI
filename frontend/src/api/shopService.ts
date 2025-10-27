import { MOCK_MODE, mockApiCall } from './api';
import { MOCK_REWARDS } from '../data/_mockData'; // Adjust path if needed
import type { RewardItem, ClaimResponse } from '../types';

/**
 * Fetches the list of available rewards.
 */
export const getRewards = (): Promise<RewardItem[]> => {
    if (MOCK_MODE) {
        console.log("Mock: Fetching rewards...");
        return mockApiCall([...MOCK_REWARDS]); // Return a copy
    }
    // TODO: Implement real API call: return api.get('/api/shop/rewards/');
    console.warn("[getRewards] Real API call not implemented yet.");
    return Promise.resolve([]); // Return empty for now if not mocking
};

/**
 * Attempts to claim a specific reward for the user.
 * @param {string | number} rewardId - The ID of the reward to claim.
 * @param {number} currentUserPoints - The current points balance of the user (needed for mock).
 * @returns {Promise<ClaimResponse>} - Response indicating success/failure.
 */
export const claimReward = (
    rewardId: string | number,
    currentUserPoints: number // <-- Add parameter
): Promise<ClaimResponse> => {
     if (MOCK_MODE) {
        console.log(`Mock: Attempting to claim reward ID: ${rewardId} with user points: ${currentUserPoints}`);
        const reward = MOCK_REWARDS.find(r => r.id === rewardId);

        // --- Use the passed currentUserPoints ---
        if (reward && currentUserPoints >= reward.cost) {
            console.log("Mock: Claim successful!");
            const remaining = currentUserPoints - reward.cost;
            // Don't update mock user, just return simulated result
            return mockApiCall({ success: true, message: `Successfully claimed ${reward.name}!`, remainingPoints: remaining });
        } else if (reward) {
             console.log("Mock: Claim failed - insufficient points.");
             return mockApiCall({ success: false, message: `Need ${reward.cost} pts, you have ${currentUserPoints}.` });
        } else {
            console.log("Mock: Claim failed - reward not found.");
            return mockApiCall({ success: false, message: "Reward not found." });
        }
        // ---
    }
    // TODO: Implement real API call: return api.post(`/api/shop/claim/${rewardId}/`);
    // The real API call *doesn't* need currentUserPoints; the backend handles that check.
    console.warn("[claimReward] Real API call not implemented yet.");
     return Promise.reject(new Error("Claim reward API not implemented"));
};