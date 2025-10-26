import axios from "axios";
// /src/api/leaderboardService.ts
import { MOCK_MODE, mockApiCall } from './api'; // Assuming MOCK_MODE is in api.ts
// --- UPDATE THIS IMPORT ---
// Import the specific leaderboard mock arrays
import {
    MOCK_LEADERBOARD_INDIVIDUAL_WEEKLY,
    MOCK_LEADERBOARD_DEPARTMENT_WEEKLY
} from '../data/_mockData'; // Adjust the path ('../data/_mockData') if your file structure is different
// --- END UPDATE ---
import type { LeaderboardData, LeaderboardPeriod, LeaderboardType } from '../types'; // Ensure types import is correct

const API_BASE_URL = "http://127.0.0.1:8000/api/leaderboards"; // Keep this if using Option B backend structure

export const getLeaderboard = async (
    period: LeaderboardPeriod,
    type: LeaderboardType,
    date?: string // Keep date for future archive use
): Promise<LeaderboardData> => {
    if (MOCK_MODE) {
        console.log(`Mock: Fetching leaderboard - Period: ${period}, Type: ${type}, Date: ${date}`);
        // Simple mock: return weekly data regardless of period for now
        // You can add more complex logic here later to return different mock
        // data based on 'period' if needed for testing.
        if (type === 'individual') {
            return mockApiCall(MOCK_LEADERBOARD_INDIVIDUAL_WEEKLY);
        } else if (type === 'department') {
            return mockApiCall(MOCK_LEADERBOARD_DEPARTMENT_WEEKLY);
        } else {
            console.warn(`Mock: Unknown leaderboard type requested: ${type}`);
            return mockApiCall([]); // Return empty array for unknown types
        }
    }

    // --- Real API Call (Using Axios based on your previous version) ---
    try {
        console.log(`Real API: Fetching ${period} ${type} leaderboard...`);
        // Use the URL structure from your file: /api/leaderboards/{period}/?type={type}
        const response = await axios.get(`${API_BASE_URL}/${period}/`, {
          params: { type },
          // Add headers/credentials as needed based on your backend auth
          // headers: token ? { Authorization: `Bearer ${token}` } : {},
          // withCredentials: true, // If using session cookies
        });
        return response.data; // Assuming backend returns data in correct format
      } catch (error: any) {
        console.error(
          `[getLeaderboard] Failed to fetch ${period} ${type} data:`,
          error.response?.data || error.message || error // Log specific Axios error if available
        );
        // Throw a new error or return empty array based on how you want components to handle it
        throw new Error(`Failed to fetch ${type} leaderboard for ${period}`);
        // return []; // Alternative: return empty array on error
      }
    // --- End Real API Call ---
};

// Assuming axios is imported if you uncomment the real call later
// import axios from 'axios';