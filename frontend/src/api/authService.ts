// What it is: Functions related to users, teams, and authentication.
// What you need to do:
// getUserProfile(): Calls GET /api/users/me/.
// getTeams(): Calls GET /api/teams/.
// completeProfile(teamId: number): Calls POST /api/users/me/complete-profile/.

// import { MOCK_MODE, mockApiCall } from './api';
// import { MOCK_DEPARTMENTS, MOCK_USER_MAIN, MOCK_USER_NEW} from '../_mocks/mockData';
// import type { Department, UserProfile } from '../types/user';

// // Simulate: log-in
// export const mockLogin = (type: 'new' | 'existing'): Promise<UserProfile> => {
//     if (type === 'new') {
//         return mockApiCall(MOCK_USER_NEW);
//     } else {
//         return mockApiCall(MOCK_USER_MAIN);
//     }
// };

// // Get list of departments for first time setup
// export const getDepartments= (): Promise<Department[]> => {
//     if (MOCK_MODE) {
//         return mockApiCall(MOCK_DEPARTMENTS);
//     }
//     // !! Real call goes here
//     return new Promise(() => {});
// };

// // Simulate: POST request to set user department
// export const completeProfile = (departmentId: number): Promise<UserProfile> => {
//     if (MOCK_MODE) {
//         return mockApiCall(MOCK_USER_MAIN);
//     }

//     // !! use departmentId later to set user's department
//     return new Promise(() => {});
// };

import type { Department, UserProfile } from '../types/user';
import { MOCK_MODE, mockApiCall } from './api';
import { MOCK_DEPARTMENTS, MOCK_USER_NEW } from '../data/_mockData';

const API_URL = 'http://localhost:8000'; // Your Django backend

// This function checks if the user has a valid session cookie
export const checkAuth = async (): Promise<{ authenticated: boolean; user: UserProfile | null }> => {
  // We NEVER mock this. This is the core of your auth.
  try {
    const response = await fetch(`${API_URL}/auth/check/`, {
      credentials: 'include', // This sends the session cookie
    });
    if (!response.ok) {
      return { authenticated: false, user: null };
    }
    const data = await response.json();
    // Assumes your /auth/check/ returns { authenticated: true, user: {...} }
    return data; 
  } catch (err) {
    return { authenticated: false, user: null };
  }
};

// This gets the Microsoft redirect URL from your backend
export const getLoginRedirectUrl = async (): Promise<{ auth_url: string }> => {
  const response = await fetch(`${API_URL}/auth/login/`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to get auth URL');
  }
  return response.json();
};

// This tells the backend to destroy the session cookie
export const logoutUser = async (): Promise<void> => {
  await fetch(`${API_URL}/auth/logout/`, {
    method: 'POST',
    credentials: 'include',
  });
};

// --- This part can still be mocked ---
// Gets the list of departments for the "FirstTimeSetupModal"
export const getDepartments = (): Promise<Department[]> => {
  if (MOCK_MODE) {
    return mockApiCall(MOCK_DEPARTMENTS);
  }
  // Real call will go here
  return new Promise(() => {});
};

// This is still needed for the modal
export const completeProfile = (departmentId: number): Promise<UserProfile> => {
  if (MOCK_MODE) {
     // TODO: Replace with a real API call later
    // Real call: return api.post('/api/users/me/complete-profile/', { departmentId });
    return mockApiCall({ ...MOCK_USER_NEW, profile_complete: true, department: MOCK_DEPARTMENTS[0] });
  }
  return new Promise(() => {});
};