// frontend/src/api/leaderboardService.ts
import type {
  LeaderboardData,
  LeaderboardPeriod,
  LeaderboardType,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Fetches leaderboard data for a specific period and type
 * GET /api/leaderboard/?period={period}&type={type}&date={date}
 */
export const getLeaderboard = async (
  period: LeaderboardPeriod,
  type: LeaderboardType,
  date?: string
): Promise<LeaderboardData> => {
  // Real API call
  try {
    // Build query parameters
    const params = new URLSearchParams({
      period: period,
      type: type, // ✅ Use 'type' to match backend parameter name
    });

    if (date) {
      params.append("date", date);
    }

    const url = `${API_BASE_URL}/api/leaderboard/?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      credentials: "include", // Include session cookies
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getLeaderboard] Error response:`, errorText);
      throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
    }

    const data = await response.json();

    // ✅ Handle multiple possible response formats robustly
    if (Array.isArray(data)) {
      // Backend returned plain array directly
      return data;
    } else if (data && Array.isArray(data.leaderboard)) {
      // Backend returned object with 'leaderboard' property

      return data.leaderboard;
    } else if (data && Array.isArray(data.results)) {
      // Backend returned object with 'results' property (DRF pagination format)
      return data.results;
    } else {
      // Unexpected format - return empty array and log warning
      console.warn(`[getLeaderboard] ⚠️ Unexpected response format:`, data);
      return [];
    }
  } catch (error) {
    console.error("[getLeaderboard] ❌ Error:", error);
    throw error;
  }
};
