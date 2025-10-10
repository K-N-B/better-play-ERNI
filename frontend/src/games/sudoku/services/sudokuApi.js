// Service to fetch Sudoku puzzles from the API

const API_BASE_URL = 'https://sudoku-api.vercel.app/api/dosuku';

/**
 * Fetch a new Sudoku puzzle from the API
 * @param {string} difficulty - 'easy' or 'hard'
 * @returns {Promise<{puzzle: Array, solution: Array}>}
 */
export const fetchSudokuPuzzle = async (difficulty) => {
  try {
    const query = `?query={newboard(limit:1){grids{value,solution,difficulty}}}`;
    const response = await fetch(`${API_BASE_URL}${query}`);

    if (!response.ok) {
      throw new Error('Failed to fetch puzzle');
    }

    const data = await response.json();
    const grid = data.newboard.grids[0];

    // Convert the API response to our format
    const puzzle = grid.value;
    const solution = grid.solution;
    const apiDifficulty = grid.difficulty.toLowerCase();

    // If the API returns a puzzle that doesn't match our difficulty,
    // we'll still use it (the API doesn't let us specify difficulty)
    // But we can filter by trying multiple times
    return {
      puzzle,
      solution,
      difficulty: apiDifficulty
    };
  } catch (error) {
    console.error('Error fetching Sudoku puzzle:', error);
    throw error;
  }
};

/**
 * Fetch multiple puzzles and return one matching the difficulty
 * @param {string} difficulty - 'easy' or 'hard'
 * @returns {Promise<{puzzle: Array, solution: Array}>}
 */
export const fetchSudokuPuzzleByDifficulty = async (difficulty) => {
  try {
    // Fetch multiple puzzles to increase chance of getting desired difficulty
    const query = `?query={newboard(limit:10){grids{value,solution,difficulty}}}`;
    const response = await fetch(`${API_BASE_URL}${query}`);

    if (!response.ok) {
      throw new Error('Failed to fetch puzzle');
    }

    const data = await response.json();
    const grids = data.newboard.grids;

    // Try to find a puzzle matching the difficulty
    let selectedGrid = grids.find(grid =>
      grid.difficulty.toLowerCase() === difficulty.toLowerCase()
    );

    // If no match, just take the first one
    if (!selectedGrid) {
      selectedGrid = grids[0];
    }

    return {
      puzzle: selectedGrid.value,
      solution: selectedGrid.solution,
      difficulty: selectedGrid.difficulty.toLowerCase()
    };
  } catch (error) {
    console.error('Error fetching Sudoku puzzle:', error);
    throw error;
  }
};
