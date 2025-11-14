import type { ActivityHubResponse } from "../types/activity";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Helper function to get CSRF token from cookies
 */
function getCookie(name: string): string | null {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

/**
 * Fetches both recent activity and online users
 * GET /api/activity-hub/
 */
export const getActivityHub = async (): Promise<ActivityHubResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/activity-hub/`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getActivityHub] ❌ Error: ${errorText}`);
      throw new Error(`Failed to fetch activity hub: ${response.statusText}`);
    }

    const data: ActivityHubResponse = await response.json();
    return data;
  } catch (error) {
    console.error("[getActivityHub] ❌ Error:", error);
    throw error;
  }
};

/**
 * Sends a heartbeat signal to update user's last_active timestamp
 * POST /api/heartbeat/
 */
export const sendHeartbeat = async (): Promise<void> => {
  // if (MOCK_MODE) {
  //     console.log('Mock: Sending heartbeat...');
  //     return mockApiCall(undefined);
  // }

  try {
    const csrfToken = getCookie("csrftoken");

    if (!csrfToken) {
      console.warn("[sendHeartbeat] ⚠️ No CSRF token found");
    }

    const response = await fetch(`${API_BASE_URL}/api/heartbeat/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken || "",
      },
      body: JSON.stringify({}), // Send empty body
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[sendHeartbeat] ❌ Error response: ${errorText}`);
      throw new Error(`Heartbeat failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error("[sendHeartbeat] ❌ Error:", error);
    // Don't throw - heartbeat failures shouldn't break the app
  }
};
