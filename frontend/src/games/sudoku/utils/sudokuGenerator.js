// Sudoku puzzle generator and solver utilities

/**
 * Check if a number is valid in a given position
 */
export const isValid = (board, row, col, num) => {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false;
  }

  // Check column
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) return false;
  }

  // Check 3x3 box
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i + startRow][j + startCol] === num) return false;
    }
  }

  return true;
};

/**
 * Solve the Sudoku board using backtracking
 */
export const solveSudoku = (board) => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;

            if (solveSudoku(board)) {
              return true;
            }

            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
};

/**
 * Generate a filled Sudoku board
 */
export const generateFullBoard = () => {
  const board = Array(9).fill(null).map(() => Array(9).fill(0));

  // Fill diagonal 3x3 boxes first (they are independent)
  const fillBox = (row, col) => {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const randomIndex = Math.floor(Math.random() * nums.length);
        board[row + i][col + j] = nums[randomIndex];
        nums.splice(randomIndex, 1);
      }
    }
  };

  fillBox(0, 0);
  fillBox(3, 3);
  fillBox(6, 6);

  // Solve the rest
  solveSudoku(board);

  return board;
};

/**
 * Remove numbers from the board to create a puzzle
 */
export const generatePuzzle = (difficulty = 'medium') => {
  const board = generateFullBoard();
  const puzzle = board.map(row => [...row]);

  // Difficulty levels (number of cells to remove)
  const cellsToRemove = {
    easy: 30,
    medium: 40,
    hard: 50
  };

  const removeCount = cellsToRemove[difficulty] || 40;
  let removed = 0;

  while (removed < removeCount) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);

    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0;
      removed++;
    }
  }

  return {
    puzzle,
    solution: board
  };
};

/**
 * Check if the puzzle is solved correctly
 */
export const checkSolution = (board, solution) => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] !== solution[row][col]) {
        return false;
      }
    }
  }
  return true;
};

/**
 * Deep copy a board
 */
export const copyBoard = (board) => {
  return board.map(row => [...row]);
};
