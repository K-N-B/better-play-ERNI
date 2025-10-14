import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const userAPI = {
  getLeaderboard: async (period = 'all_time') => {
    const response = await axios.get(`${API_URL}/leaderboard?period=${period}`, { withCredentials: true });
    return response.data;
  },

  getUserStats: async () => {
    const response = await axios.get(`${API_URL}/user/stats`, { withCredentials: true });
    return response.data;
  },

  getUserProfile: async () => {
    const response = await axios.get(`${API_URL}/user/profile`, { withCredentials: true });
    return response.data;
  },

  // 👇 NEW FUNCTION (admin dashboard stats)
  getStats: async () => {
    const response = await axios.get(`${API_URL}/admin/stats`, { withCredentials: true });
    return response.data;
  },
};

