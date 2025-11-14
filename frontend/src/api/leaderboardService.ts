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
    console.log(
      `[getLeaderboard] Fetching: period=${period}, type=${type}, date=${date}`
    );

    // Build query parameters
    const params = new URLSearchParams({
      period: period,
      type: type, // ✅ Use 'type' to match backend parameter name
    });

    if (date) {
      params.append("date", date);
    }

    const url = `${API_BASE_URL}/api/leaderboard/?${params.toString()}`;
    console.log(`[getLeaderboard] Request URL: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      credentials: "include", // Include session cookies
      headers: {
        Accept: "application/json",
      },
    });

    console.log(`[getLeaderboard] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getLeaderboard] Error response:`, errorText);
      throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[getLeaderboard] Response data:`, data);
    console.log(
      `[getLeaderboard] Response type:`,
      typeof data,
      "IsArray:",
      Array.isArray(data)
    );

    // ✅ Handle multiple possible response formats robustly
    if (Array.isArray(data)) {
      // Backend returned plain array directly
      console.log(
        `[getLeaderboard] ✅ Returning array directly, length:`,
        data.length
      );
      return data;
    } else if (data && Array.isArray(data.leaderboard)) {
      // Backend returned object with 'leaderboard' property
      console.log(
        `[getLeaderboard] ✅ Extracting leaderboard array, length:`,
        data.leaderboard.length
      );
      return data.leaderboard;
    } else if (data && Array.isArray(data.results)) {
      // Backend returned object with 'results' property (DRF pagination format)
      console.log(
        `[getLeaderboard] ✅ Extracting results array, length:`,
        data.results.length
      );
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
