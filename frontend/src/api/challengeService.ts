import { MOCK_MODE, mockApiCall } from './api';
import {
    MOCK_USERS_SEARCH,
    MOCK_PENDING_CHALLENGES,
    MOCK_COMPLETED_CHALLENGES
} from '../data/_mockData';
import type { Challenge, CreateChallengeData, CompleteChallengeData } from '../types/challenge';
import type { UserProfile } from '../types/user';

// Simulates searching for users to challenge
export const searchUsers = (query: string): Promise<Pick<UserProfile, 'id' | 'username' | 'email'>[]> => {
    if (MOCK_MODE) {
        console.log(`Mock: Searching users with query "${query}"...`);
        const lowerQuery = query.toLowerCase();
        const results = MOCK_USERS_SEARCH.filter(user =>
            user.username.toLowerCase().includes(lowerQuery) ||
            user.email.toLowerCase().includes(lowerQuery)
        );
        return mockApiCall(results);
    }
    // Real call: return api.get(`/api/users/?search=${encodeURIComponent(query)}`);
    return new Promise(() => {});
};

// Gets challenges pending for the current user
export const getPendingChallenges = (): Promise<Challenge[]> => {
    if (MOCK_MODE) {
        console.log("Mock: Fetching pending challenges...");
        // In real app, backend filters by request.user
        return mockApiCall([...MOCK_PENDING_CHALLENGES]); // Return a copy
    }
    // Real call: return api.get('/api/challenges/pending/');
    return new Promise(() => {});
};

// Gets completed challenges involving the current user (example)
export const getCompletedChallenges = (): Promise<Challenge[]> => {
    if (MOCK_MODE) {
        console.log("Mock: Fetching completed challenges...");
         // In real app, backend filters by request.user (as challenger or recipient)
        return mockApiCall([...MOCK_COMPLETED_CHALLENGES]); // Return a copy
    }
    // Real call: return api.get('/api/challenges/completed/'); // Example endpoint
    return new Promise(() => {});
};


// Sends a request to create a new challenge
export const sendChallenge = (data: CreateChallengeData): Promise<Challenge> => {
     if (MOCK_MODE) {
        console.log("Mock: Sending challenge...", data);
        const recipient = MOCK_USERS_SEARCH.find(u => u.id === data.recipient_id);
        const newChallenge: Challenge = {
           // Base structure from an existing pending challenge for simplicity
           ...(MOCK_PENDING_CHALLENGES.length > 0 ? MOCK_PENDING_CHALLENGES[0] : {} as Challenge),
           id: Math.floor(Math.random() * 10000), // New random ID
           recipient: recipient ? { id: recipient.id, username: recipient.username } : { id: 99, username: 'Unknown'},
           challenger: { id: 1, username: 'gavin_cii' }, // Assume challenger is user 1
           // Mock challenger submission details
           challenger_submission: { id: data.submission_id, points_awarded: 555, time_taken_ms: 70000, tries: 3 }, // Use points_awarded
           created_at: new Date().toISOString(),
           status: 'PENDING',
           recipient_submission: null,
           winner: null,
           // You might need to derive puzzle_type/id from submission_id in a real mock
           puzzle_type: 'wordle', // Placeholder
           puzzle_id: 101,       // Placeholder
        };
        // Add to the runtime mock array
        MOCK_PENDING_CHALLENGES.push(newChallenge);
        return mockApiCall(newChallenge);
    }
    // Real call: return api.post('/api/challenges/', data);
    return new Promise(() => {});
};

// Sends a request to complete a challenge after the recipient plays
export const completeChallenge = (challengeId: number, data: CompleteChallengeData): Promise<Challenge> => {
    if (MOCK_MODE) {
        console.log(`Mock: Completing challenge ${challengeId}...`, data);
        const challengeIndex = MOCK_PENDING_CHALLENGES.findIndex(c => c.id === challengeId);
        if (challengeIndex > -1) {
            const completed = {
                ...MOCK_PENDING_CHALLENGES[challengeIndex],
                status: 'COMPLETED',
                // Mock recipient submission data
                recipient_submission: { id: data.submission_id, points_awarded: 600, time_taken_ms: 60000, tries: 1 } // Use points_awarded
            } as Challenge;

            // Determine winner (mock logic using points_awarded)
            if(completed.recipient_submission && completed.challenger_submission){
                if(completed.recipient_submission.points_awarded > completed.challenger_submission.points_awarded) { // Use points_awarded
                    completed.winner = completed.recipient;
                } else if (completed.recipient_submission.points_awarded < completed.challenger_submission.points_awarded) { // Use points_awarded
                     completed.winner = completed.challenger;
                } else {
                    completed.winner = null; // Tie
                }
            }
            // Move from pending to completed in mock data
            MOCK_PENDING_CHALLENGES.splice(challengeIndex, 1);
            MOCK_COMPLETED_CHALLENGES.push(completed);
            return mockApiCall(completed);

        } else {
             console.error(`Mock: Challenge ${challengeId} not found in pending.`);
             return Promise.reject(new Error("Challenge not found"));
        }
    }
    // Real call: return api.post(`/api/challenges/${challengeId}/complete/`, data);
    return new Promise(() => {});
};