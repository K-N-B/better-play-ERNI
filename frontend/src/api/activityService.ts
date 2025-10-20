import { MOCK_MODE, mockApiCall } from './api';
import { MOCK_ACTIVITY_HUB } from '../data/_mockData'; // Ensure MOCK_ACTIVITY_HUB is defined
import type { ActivityHubResponse } from '../types/activity';

// Fetches both recent activity and online users
export const getActivityHub = (): Promise<ActivityHubResponse> => {
    if (MOCK_MODE) {
        // console.log('Mock: Fetching activity hub data...'); // Optional log
        // Simulate potential small changes in mock data if desired
        return mockApiCall({ ...MOCK_ACTIVITY_HUB }); // Return a copy
    }
    // Real API call:
    // return api.get('/api/activity-hub/');
    return new Promise(() => {}); // Placeholder for real call
};

// Sends a signal to the backend indicating the user is active
export const sendHeartbeat = (): Promise<void> => {
     if (MOCK_MODE) {
        // console.log('Mock: Sending heartbeat...'); // Optional log
        return mockApiCall(undefined); // Mock succeeds instantly
    }
    // Real API call:
    // return api.post('/api/heartbeat/');
    return new Promise(() => {}); // Placeholder for real call
}