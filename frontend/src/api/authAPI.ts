import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const authAPI = {
  // Sync user from Entra ID / Azure AD token
  syncUser: async (token?: string) => {
    const accessToken = token || sessionStorage.getItem('access_token');
    if (!accessToken) throw new Error('No access token provided');

    const response = await axios.post(
      `${API_URL}/auth/sync`,
      {},
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      }
    );
    return response.data;
  },

  // Get current user profile
  getProfile: async (token?: string) => {
    const accessToken = token || sessionStorage.getItem('access_token');
    if (!accessToken) throw new Error('No access token provided');

    const response = await axios.get(`${API_URL}/user/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      withCredentials: true,
    });
    return response.data;
  },
};
