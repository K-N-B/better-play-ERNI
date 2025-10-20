import type { UserProfile, Department } from '../types/user';
import type { DailyPuzzleResponse } from '../types/game';
import type { IndividualScoreEntry, DepartmentScoreEntry } from '../types/leaderboard'; // Updated type name
import type { ActivityHubResponse, OnlineUser } from '../types/activity';

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
    department: MOCK_DEPARTMENTS[1],
    profile_complete: true,
    total_points_alltime: 1250,
    current_streak_count: 3,
    max_streak_count: 5,
    challenges_made_count: 10
}

// Mock user 2 with no department yet
export const MOCK_USER_NEW: UserProfile = {
  id: 2,
  username: 'new_user',
  email: 'new.user@erni.com',
  department: null,
  profile_complete: false,
  total_points_alltime: 0,
  current_streak_count: 0,
  max_streak_count: 0,
  challenges_made_count: 0
};

export const MOCK_PUZZLES: DailyPuzzleResponse = {
  date: '2025-10-20',
  wordle: {
    id: 101,
    solution_word: 'REACT', // The solution for our test
  },
  sudoku: {
    id: 201,
    puzzle_string: '003020600900305001001806400008102900700000008006708200002609500800203009005010300',
    solution_string: '483921657967345821251876493548132976729564138136798245372689514814253769695417382',
    difficulty: 'EASY',
  },
  ernigram: {
    id: 301,
    solution_phrase: 'CONTINUOUS LEARNING',
    clue: 'A core company value',
  },
};

export const MOCK_LEADERBOARD_INDIVIDUAL_WEEKLY: IndividualScoreEntry[] = [
  { user: { id: 1, username: 'gavin_cii' }, score: 1250, week_start_date: '2025-10-19' },
  { user: { id: 3, username: 'sarah_b' }, score: 1100, week_start_date: '2025-10-19' },
  { user: { id: 4, username: 'mike_t' }, score: 980, week_start_date: '2025-10-19' },
];

export const MOCK_LEADERBOARD_DEPARTMENT_WEEKLY: DepartmentScoreEntry[] = [ // Renamed type
  { department: { id: 1, name: 'Engineering' }, score: 2230, week_start_date: '2025-10-19' }, // Changed team to department
  { department: { id: 2, name: 'Marketing' }, score: 1500, week_start_date: '2025-10-19' }, // Changed team to department
];

export const MOCK_ONLINE_USERS: OnlineUser[] = [
    { id: 1, username: 'gavin_cii' }, // Example user
    { id: 3, username: 'sarah_b' }, // Example user
    { id: 5, username: 'alex_m'},  // Example user
];

export const MOCK_ACTIVITY_HUB: ActivityHubResponse = {
  recent_activity: [
    { id: 105, user: { id: 3, username: 'sarah_b'}, message: 'solved the Wordle!', created_at: new Date(Date.now() - 60000 * 2).toISOString() }, // 2 mins ago
    { id: 104, user: { id: 1, username: 'gavin_cii'}, message: 'completed the Sudoku!', created_at: new Date(Date.now() - 60000 * 5).toISOString() }, // 5 mins ago
    { id: 103, user: { id: 5, username: 'alex_m'}, message: 'set a new high score in Wordle!', created_at: new Date(Date.now() - 60000 * 10).toISOString() }, // 10 mins ago
    { id: 102, user: { id: 1, username: 'gavin_cii'}, message: 'solved the ERNIgram!', created_at: new Date(Date.now() - 60000 * 15).toISOString() }, // 15 mins ago
  ],
  online_users: MOCK_ONLINE_USERS,
};