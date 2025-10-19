import type { UserProfile, Department } from '../types/user';

// Mock Departments
export const MOCK_DEPARTMENTS: Department[] = [
    { id: 1, name: 'Backend & Cloud'},
    { id: 2, name: 'Data & AI'},
    { id: 3, name: 'Web Dev 1'},
    { id: 4, name: 'Web Dev 2'},
    { id: 5, name: 'Sales'},
    { id: 6, name: 'HR & Admin'}
];

// Mock user 1 with a department
export const MOCK_USER_MAIN: UserProfile = {
    id: 1,
    username: 'forondayna',
    email: 'forondayna1214@gmail.com',
    department: MOCK_DEPARTMENTS[0],
    profile_complete: true,
    total_points_alltime: 1250,
    streak_count: 3
}

// Mock user 2 with no department yet
export const MOCK_USER_NEW: UserProfile = {
  id: 2,
  username: 'new_user',
  email: 'new.user@erni.com',
  department: null,
  profile_complete: false,
  total_points_alltime: 0,
  streak_count: 0,
};