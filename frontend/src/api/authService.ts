// What it is: Functions related to users, teams, and authentication.
// What you need to do:
// getUserProfile(): Calls GET /api/users/me/.
// getTeams(): Calls GET /api/teams/.
// completeProfile(teamId: number): Calls POST /api/users/me/complete-profile/.

import type { Department, UserProfile } from "../types/user";
import { MOCK_MODE, mockApiCall } from "./api";
import { MOCK_DEPARTMENTS, MOCK_USER_MAIN } from "../data/_mockData";

const API_URL = "http://localhost:8000"; // Your Django backend

// This function checks if the user has a valid session cookie
export const checkAuth = async (): Promise<{
  authenticated: boolean;
  user: UserProfile | null;
}> => {
  // We NEVER mock this. This is the core of your auth.
  try {
    const response = await fetch(`${API_URL}/auth/check/`, {
      credentials: "include", // This sends the session cookie
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
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to get auth URL");
  }
  return response.json();
};

// This tells the backend to destroy the session cookie
export const logoutUser = async (): Promise<void> => {
  await fetch(`${API_URL}/auth/logout/`, {
    method: "POST",
    credentials: "include",
  });
};

// --- This part can still be mocked ---
// Gets the list of departments for the "FirstTimeSetupModal"
export const getDepartments = async (): Promise<Department[]> => {
  // if (MOCK_MODE) {
  //   return mockApiCall(MOCK_DEPARTMENTS);
  // }
  // Real call will go here
  // --- START REAL API CALL ---
  try {
    console.log('[getDepartments] Fetching real data...');
    const response = await fetch(`${API_URL}/api/departments/`, { // <-- Use correct endpoint URL
      credentials: 'include', // <-- Include cookies for authentication
      headers: {
        'Accept': 'application/json', // Optional: Specify expected content type
      }
    });

    if (!response.ok) {
      // Handle non-2xx responses (like 403 Forbidden if not authenticated)
      console.error(`[getDepartments] API request failed with status ${response.status}`);
      throw new Error(`Failed to fetch departments: ${response.statusText}`);
    }

    const data: Department[] = await response.json(); // Parse the JSON response
    console.log('[getDepartments] Fetched real data:', data);
    return data;

  } catch (error) {
    console.error('[getDepartments] Fetch error:', error);
    // Re-throw the error or return an empty array, depending on how you want to handle errors
    throw error; // Let the calling component handle the error state
    // Or return [];
  }
  // --- END REAL API CALL ---
}
  

// This is still needed for the modal
export const completeProfile = async (departmentId: number): Promise<UserProfile> => {
  // if (MOCK_MODE) {
  //   // TODO: Replace with a real API call later
  //   // Real call: return api.post('/api/users/me/complete-profile/', { departmentId });
  //   return mockApiCall({
  //     ...MOCK_USER_MAIN,
  //     profile_complete: true,
  //     department: MOCK_DEPARTMENTS[1],
  //   });
  // }

  try {
    console.log(`[completeProfile] Sending real request... Dept ID: ${departmentId}`);
    // --- Get CSRF Token ---
    const csrfToken = getCookie('csrftoken'); // Default Django CSRF cookie name
    if (!csrfToken) {
       console.error("[completeProfile] CSRF token not found. Ensure backend sends 'csrftoken' cookie.");
       throw new Error("CSRF token missing. Cannot complete profile.");
    }
    // ---

    const response = await fetch(`${API_URL}/api/users/me/complete-profile/`, {
       method: 'POST',
       credentials: 'include',
       headers: {
         'Content-Type': 'application/json',
         // --- Add CSRF Token Header ---
         'X-CSRFToken': csrfToken,
         // ---
       },
       body: JSON.stringify({ department_id: departmentId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[completeProfile] API request failed (${response.status}):`, errorData);
      throw new Error(`Failed to complete profile: ${errorData.detail || response.statusText}`);
    }

    const updatedUserProfile: UserProfile = await response.json();
    console.log('[completeProfile] Profile updated successfully:', updatedUserProfile);
    return updatedUserProfile;

  } catch (error) {
    console.error('[completeProfile] Fetch error:', error);
    throw error;
  }
};

function getCookie(name: string): string | null {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}