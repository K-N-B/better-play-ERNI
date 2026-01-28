// frontend/src/api/authService.ts
import type { Department, UserProfile } from "../types/user";

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Check if user has a valid session cookie
 * GET /auth/check/
 */
export const checkAuth = async (): Promise<{
  authenticated: boolean;
  user: UserProfile | null;
}> => {
  try {
    const response = await fetch(`${API_URL}/auth/check/`, {
      credentials: "include", // This sends the session cookie
    });

    if (!response.ok) {
      return { authenticated: false, user: null };
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[checkAuth] Error:', err);
    return { authenticated: false, user: null };
  }
};

/**
 * Get the Microsoft redirect URL from backend
 * GET /auth/login/
 */
export const getLoginRedirectUrl = async (): Promise<{ auth_url: string }> => {
  const response = await fetch(`${API_URL}/auth/login/`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to get auth URL");
  }

  return response.json();
};

/**
 * Tell backend to destroy the session cookie
 * POST /auth/logout/
 * * FIX: Added CSRF token to headers to prevent 403 Forbidden error.
 */
export const logoutUser = async (): Promise<void> => {
  const csrfToken = getCookie('csrftoken');
  if (!csrfToken) {
    console.warn("[logoutUser] CSRF token not found. Logout may fail.");
  }
  
  const response = await fetch(`${API_URL}/auth/logout/`, {
    method: "POST",
    credentials: "include",
    headers: {
      'Content-Type': 'application/json',
      // CRUCIAL ADDITION: Send the CSRF token
      'X-CSRFToken': csrfToken || '', 
    },
    body: JSON.stringify({}), // Include a body for fetch consistency with POST
  });
  
  if (!response.ok) {
      // Throw an error if the backend request failed (e.g., 403, 500)
      const errorText = await response.text();
      console.error(`[logoutUser] API request failed (${response.status}):`, errorText);
      throw new Error(`Failed to log out: ${response.statusText}`);
  }
};

/**
 * Fetch list of all departments
 * GET /api/departments/
 */
export const getDepartments = async (): Promise<Department[]> => {
  try {
    console.log('[getDepartments] Fetching real data...');
    const response = await fetch(`${API_URL}/api/departments/`, {
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      console.error(`[getDepartments] API request failed with status ${response.status}`);
      throw new Error(`Failed to fetch departments: ${response.statusText}`);
    }

    const data: Department[] = await response.json();
    console.log('[getDepartments] Fetched departments:', data);
    return data;

  } catch (error) {
    console.error('[getDepartments] Fetch error:', error);
    throw error;
  }
};

/**
 * Complete user profile by selecting a department
 * POST /api/users/me/complete-profile/
 */
export const completeProfile = async (departmentId: number): Promise<UserProfile> => {
  try {
    console.log(`[completeProfile] Sending request... Dept ID: ${departmentId}`);

    // Get CSRF Token
    const csrfToken = getCookie('csrftoken');
    if (!csrfToken) {
      console.error("[completeProfile] CSRF token not found.");
      throw new Error("CSRF token missing. Cannot complete profile.");
    }

    const response = await fetch(`${API_URL}/api/users/me/complete-profile/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
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

/**
 * Helper function to get CSRF token from cookies
 */
export function getCookie(name: string): string | null {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}


/**
 * Update user profile fields (e.g., email_notifications)
 * PATCH /users/me/
 */
export const updateUserProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  // 1. Get CSRF Token (Required for PATCH/POST)
  const csrfToken = getCookie('csrftoken');
  if (!csrfToken) {
    console.warn("[updateUserProfile] CSRF token not found. Update might fail.");
  }

  // 2. Make the Request
  const response = await fetch(`${API_URL}/api/users/me/`, {
    method: 'PATCH',
    credentials: 'include', // Sends the session cookie
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken || '', // Authenticate the request
    },
    body: JSON.stringify(data),
  });

  // 3. Handle Errors
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[updateUserProfile] Request failed (${response.status}):`, errorText);
    throw new Error(`Failed to update profile: ${response.statusText}`);
  }

  // 4. Return updated user
  return response.json();
};