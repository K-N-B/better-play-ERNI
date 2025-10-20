// What it is: Function for fetching all leaderboard data.
// What you need to do:
// getLeaderboard(period: string, type: string, date?: string): A single function that calls your flexible GET /api/leaderboard/ endpoint with the correct query parameters.

import { MOCK_MODE, mockApiCall } from './api';
import {
    MOCK_LEADERBOARD_INDIVIDUAL_WEEKLY,
    MOCK_LEADERBOARD_DEPARTMENT_WEEKLY // Updated import name
} from '../data/_mockData';
import type { LeaderboardData, LeaderboardPeriod, LeaderboardType } from '../types/leaderboard';

export const getLeaderboard = (
    period: LeaderboardPeriod,
    type: LeaderboardType,
    date?: string
): Promise<LeaderboardData> => {
    if (MOCK_MODE) {
        console.log(`Mock: Fetching leaderboard - Period: ${period}, Type: ${type}, Date: ${date}`);
        if (type === 'individual') {
            return mockApiCall(MOCK_LEADERBOARD_INDIVIDUAL_WEEKLY);
        } else { // type === 'department'
            return mockApiCall(MOCK_LEADERBOARD_DEPARTMENT_WEEKLY); // Updated variable name
        }
    }
    // !! Real call: return api.get(`/api/leaderboard?period=${period}&type=${type}${date ? `&date=${date}` : ''}`);
    return new Promise(() => {});
};