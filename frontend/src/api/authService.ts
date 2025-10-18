// What it is: Functions related to users, teams, and authentication.
// What you need to do:
// getUserProfile(): Calls GET /api/users/me/.
// getTeams(): Calls GET /api/teams/.
// completeProfile(teamId: number): Calls POST /api/users/me/complete-profile/.

import { MOCK_MODE, mockApiCall } from './api';
import { MOCK_DEPARTMENTS, MOCK_USER_MAIN, MOCK_USER_NEW} from '../_mocks/mockData';
import type { Department, UserProfile } from '../types/user';

// Simulate: log-in
export const mockLogin = (type: 'new' | 'existing'): Promise<UserProfile> => {
    if (type === 'new') {
        return mockApiCall(MOCK_USER_NEW);
    } else {
        return mockApiCall(MOCK_USER_MAIN);
    }
};

// Get list of departments for first time setup
export const getDepartments= (): Promise<Department[]> => {
    if (MOCK_MODE) {
        return mockApiCall(MOCK_DEPARTMENTS);
    }
    // !! Real call goes here
    return new Promise(() => {});
};

// Simulate: POST request to set user department
export const completeProfile = (departmentId: number): Promise<UserProfile> => {
    if (MOCK_MODE) {
        return mockApiCall(MOCK_USER_MAIN);
    }

    // !! use departmentId later to set user's department
    return new Promise(() => {});
};