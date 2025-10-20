import type { UserProfile, Department } from '../types/user';
import type { DailyPuzzleResponse } from '../types/game';

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