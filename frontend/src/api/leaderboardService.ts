import axios from "axios";
import type {
  LeaderboardPeriod,
  LeaderboardType,
  LeaderboardData,
} from "../types/leaderboard";

const API_BASE_URL = "http://127.0.0.1:8000/api/leaderboards";

export const getLeaderboard = async (
  period: LeaderboardPeriod,
  type: LeaderboardType
): Promise<LeaderboardData> => {
  try {
    const token = localStorage.getItem("accessToken");

    const response = await axios.get(`${API_BASE_URL}/${period}/`, {
      params: { type },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true,
    });

    return response.data;
  } catch (error: any) {
    console.error(
      `[getLeaderboard] Failed to fetch ${period} ${type} data:`,
      error
    );
    throw new Error("Failed to fetch leaderboard data");
  }
};
