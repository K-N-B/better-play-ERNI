// frontend/src/api/challengeService.ts

import type {
  Challenge,
  CreateChallengeData,
  CompleteChallengeData,
} from "../types/challenge";
import type { UserProfile } from "../types/user";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* -----------------------------
   Helper: Get CSRF token
----------------------------- */
function getCsrfToken(): string | null {
  const name = "csrftoken";
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split("=");
    if (key === name) return value;
  }
  return null;
}

/* -----------------------------
   User Search
----------------------------- */
export const searchUsers = async (
  query: string
): Promise<Pick<UserProfile, "id" | "username" | "email">[]> => {
  // if (MOCK_MODE) {
  //     console.log(`Mock: Searching users with query "${query}"...`);
  //     const lowerQuery = query.toLowerCase();
  //     const results = MOCK_USERS_SEARCH.filter(user =>
  //         user.username.toLowerCase().includes(lowerQuery) ||
  //         user.email.toLowerCase().includes(lowerQuery)
  //     );
  //     return mockApiCall(results);
  // }

  const response = await fetch(
    `${API_URL}/api/challenges/search-users/?q=${encodeURIComponent(query)}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) throw new Error("Failed to search users");
  return response.json();
};

/* -----------------------------
   Get Pending Challenges
----------------------------- */
export const getPendingChallenges = async (): Promise<Challenge[]> => {
  // if (MOCK_MODE) {
  //     console.log("Mock: Fetching pending challenges...");
  //     return mockApiCall([...MOCK_PENDING_CHALLENGES]);
  // }

  const response = await fetch(`${API_URL}/api/challenges/pending/`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) throw new Error("Failed to fetch pending challenges");
  return response.json();
};

/* -----------------------------
   Get Completed Challenges
----------------------------- */
export const getCompletedChallenges = async (): Promise<Challenge[]> => {
  // if (MOCK_MODE) {
  //     console.log("Mock: Fetching completed challenges...");
  //     return mockApiCall([...MOCK_COMPLETED_CHALLENGES]);
  // }

  const response = await fetch(`${API_URL}/api/challenges/completed/`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) throw new Error("Failed to fetch completed challenges");
  return response.json();
};

/* -----------------------------
   Send Challenge
----------------------------- */
export const sendChallenge = async (
  data: CreateChallengeData
): Promise<Challenge> => {
  const csrfToken = getCsrfToken();

  console.log("[sendChallenge] CSRF Token:", csrfToken); // Debug log
  console.log("[sendChallenge] Sending data:", data); // Debug log

  const response = await fetch(`${API_URL}/api/challenges/send/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken && { "X-CSRFToken": csrfToken }),
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  console.log("[sendChallenge] Response status:", response.status); // Debug log
  console.log("[sendChallenge] Response headers:", response.headers); // Debug log

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    console.error("[sendChallenge] Error content-type:", contentType); // Debug log

    if (contentType?.includes("application/json")) {
      const error = await response.json();
      console.error("[sendChallenge] Error JSON:", error); // Debug log
      throw new Error(error.error || "Failed to send challenge");
    } else {
      const text = await response.text();
      console.error(
        "[sendChallenge] Server returned HTML:",
        text.substring(0, 500)
      ); // Show first 500 chars
      throw new Error("Server returned an error page. Check backend console.");
    }
  }

  return response.json();
};

/* -----------------------------
   Complete Challenge
----------------------------- */
export const completeChallenge = async (
  challengeId: number,
  data: CompleteChallengeData
): Promise<Challenge> => {
  // if (MOCK_MODE) {
  //     console.log(`Mock: Completing challenge ${challengeId}...`, data);
  //     const idx = MOCK_PENDING_CHALLENGES.findIndex(c => c.id === challengeId);
  //     if (idx > -1) {
  //         const completed = {
  //             ...MOCK_PENDING_CHALLENGES[idx],
  //             status: 'COMPLETED',
  //             recipient_submission: {
  //                 id: data.submission_id,
  //                 points_awarded: 600,
  //                 time_taken_ms: 60000,
  //                 tries: 1
  //             }
  //         } as Challenge;

  //         if (completed.recipient_submission && completed.challenger_submission) {
  //             if (completed.recipient_submission.points_awarded >
  //                 completed.challenger_submission.points_awarded) {
  //                 completed.winner = completed.recipient;
  //             } else if (completed.recipient_submission.points_awarded <
  //                 completed.challenger_submission.points_awarded) {
  //                 completed.winner = completed.challenger;
  //             } else {
  //                 completed.winner = null;
  //             }
  //         }

  //         MOCK_PENDING_CHALLENGES.splice(idx, 1);
  //         MOCK_COMPLETED_CHALLENGES.push(completed);
  //         return mockApiCall(completed);
  //     } else {
  //         console.error(`Mock: Challenge ${challengeId} not found in pending.`);
  //         throw new Error("Challenge not found");
  //     }
  // }

  const csrfToken = getCsrfToken();

  console.log("[completeChallenge] CSRF Token:", csrfToken); // Debug log
  console.log("[completeChallenge] Sending data:", data); // Debug log

  const response = await fetch(
    `${API_URL}/api/challenges/${challengeId}/complete/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken && { "X-CSRFToken": csrfToken }),
      },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );

  console.log("[completeChallenge] Response status:", response.status); // Debug log

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    console.error("[completeChallenge] Error content-type:", contentType); // Debug log

    if (contentType?.includes("application/json")) {
      const error = await response.json();
      console.error("[completeChallenge] Error JSON:", error); // Debug log
      throw new Error(error.error || "Failed to complete challenge");
    } else {
      const text = await response.text();
      console.error(
        "[completeChallenge] Server returned HTML:",
        text.substring(0, 500)
      );
      throw new Error("Server returned an error page. Check backend console.");
    }
  }

  return response.json();
};

export const listAllUsers = async (): Promise<
  Pick<UserProfile, "id" | "username" | "email">[]
> => {
  // if (MOCK_MODE) {
  //     console.log("Mock: Listing all users...");
  //     return mockApiCall([...MOCK_USERS_SEARCH]);
  // }

  const response = await fetch(`${API_URL}/api/challenges/list-users/`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) throw new Error("Failed to list users");
  return response.json();
};
