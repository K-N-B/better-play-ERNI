// The main logic. It fetches the puzzle string, manages the 9x9 grid state (likely a 2D array of objects: { value: number | null, isGiven: boolean, notes: number[] }), and handles cell selection. It also manages the "note mode" toggle. It calls saveProgress() and submitPuzzle().

import { useState, useEffect, useCallback } from 'react';
import type { SudokuPuzzle, SudokuCell, PuzzleAttemptData, SubmissionData } from '../../../types/game';
import { SudokuGrid } from './sudokuGrid';
import { NumberPad } from './numberPad';
import { submitPuzzle, getSavedAttempt, saveProgress } from '../../../api/gameService';
import { useApi } from '../../../hooks/useApi';
import { LoadingSpinner } from '../../ui/loadingSpinner';
import { PostGameResultsModal } from '../../ui/postGameResultsModal';
import { useTimer } from '../../../hooks/useTimer'; // We'll create this next
import { Timer } from '../../ui/timer';

// --- Helper Functions (Put these in a separate /utils file later) ---
// Parses the puzzle string into our 2D grid state
const parseGrid = (puzzleString: string): SudokuCell[][] => {
  return Array.from({ length: 9 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => {
      const val = parseInt(puzzleString[r * 9 + c]);
      return {
        value: val || null,
        isGiven: !!val,
        isError: false,
        notes: [],
      };
    })
  );
};

// Checks for errors in the grid
const checkGridForErrors = (grid: SudokuCell[][]): SudokuCell[][] => {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell, isError: false })));

  // Check rows, cols, and boxes
  for (let i = 0; i < 9; i++) {
    const row = new Set();
    const col = new Set();
    const box = new Set();
    for (let j = 0; j < 9; j++) {
      // Row check
      const rowVal = newGrid[i][j].value;
      if (rowVal) {
        if (row.has(rowVal)) {
          newGrid[i][j].isError = true;
        }
        row.add(rowVal);
      }
      // Col check
      const colVal = newGrid[j][i].value;
      if (colVal) {
        if (col.has(colVal)) {
          newGrid[j][i].isError = true;
        }
        col.add(colVal);
      }
      // Box check
      const boxRow = Math.floor(i / 3) * 3 + Math.floor(j / 3);
      const boxCol = (i % 3) * 3 + (j % 3);
      const boxVal = newGrid[boxRow][boxCol].value;
      if (boxVal) {
        if (box.has(boxVal)) {
          newGrid[boxRow][boxCol].isError = true;
        }
        box.add(boxVal);
      }
    }
  }
  return newGrid;
};
// --- End Helper Functions ---


interface SudokuGameProps {
  puzzle: SudokuPuzzle;
}

export const SudokuGame = ({ puzzle }: SudokuGameProps) => {
  const [grid, setGrid] = useState<SudokuCell[][]>(() => parseGrid(puzzle.puzzle_string));
  const [selectedCell, setSelectedCell] = useState<{ row: number, col: number } | null>(null);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [gameResult, setGameResult] = useState<{ score: number } | null>(null);

  const [isGameOver, setIsGameOver] = useState(false);
  
  // --- Load saved game ---
  const fetchSavedSudoku = useCallback(() => getSavedAttempt('sudoku'), []);
  const { data: savedGame, loading } = useApi(fetchSavedSudoku);
  const { time, startTimer, stopTimer, setSavedTime } = useTimer(); // We'll create this next

  useEffect(() => {
    if (savedGame) {
      setGrid(savedGame.progress_data as SudokuCell[][]);
      setSavedTime(savedGame.time_spent_ms); // Use the 'setTime' from the hook
    }
    startTimer();
    
    // The cleanup is now handled by the useTimer hook itself
  }, [savedGame, startTimer, setSavedTime]); // Dependencies are now stable

  // --- Auto-save progress ---
  useEffect(() => {
    if (savedGame && savedGame.puzzle_type === 'sudoku') {
      setGrid(savedGame.progress_data as SudokuCell[][]);
      setSavedTime(savedGame.time_spent_ms);
    }
    startTimer();
  }, [savedGame, startTimer, setSavedTime]);

  // --- Auto-save progress ---
  useEffect(() => {
    // console.log(`[Sudoku Auto-Save Effect] Running. loading=${loading}, isGameOver=${isGameOver}, gameResult=${!!gameResult}`); // Optional debug log

    if (loading || isGameOver) { // Simplified condition: Don't save if loading or game is fully over
        // console.log(`[Sudoku Auto-Save Effect] Condition met, SKIPPING save.`); // Optional debug log
        return;
    }

    // console.log(`[Sudoku Auto-Save Effect] Setting save timeout...`); // Optional debug log

    const saveTimer = setTimeout(() => {
      // console.log(`[Sudoku Auto-Save Effect] Timeout fired! Calling saveProgress.`); // Optional debug log
      saveProgress({
        puzzle_id: puzzle.id,
        puzzle_type: 'sudoku',
        progress_data: grid, // Reads the current grid state
        time_spent_ms: time, // Reads the current time state
      });
    }, 2000);

    return () => {
        // console.log(`[Sudoku Auto-Save Effect] Cleanup: Clearing timeout.`); // Optional debug log
        clearTimeout(saveTimer);
    };
    // --- THIS IS THE FIX ---
    // Remove 'time' from this dependency array.
    // Also removed 'loading' and 'gameResult' as the if condition handles them.
  }, [grid, isGameOver, puzzle.id]);

  // --- Input Handlers ---
  const handleCellClick = (row: number, col: number) => {
    if (isGameOver) return;
    setSelectedCell({ row, col });
  };

  const handleNumberClick = (num: number) => {
    if (!selectedCell || isGameOver) return;
    
    const { row, col } = selectedCell;
    const newGrid = [...grid.map(row => [...row.map(cell => ({ ...cell }))])]; // Deep copy
    const cell = newGrid[row][col];

    if (isNoteMode) {
      const noteIndex = cell.notes.indexOf(num);
      if (noteIndex > -1) cell.notes.splice(noteIndex, 1);
      else cell.notes.push(num);
      cell.value = null;
    } else {
      cell.value = cell.value === num ? null : num;
      cell.notes = [];
    }
    setGrid(checkGridForErrors(newGrid));
  };

  const handleEraseClick = () => {
    if (!selectedCell || isGameOver) return;
    const { row, col } = selectedCell;
    const newGrid = [...grid.map(row => [...row.map(cell => ({ ...cell }))])];
    newGrid[row][col].value = null;
    newGrid[row][col].notes = [];
    setGrid(checkGridForErrors(newGrid));
  };

  // --- Game Win/Submit ---
  const handleSubmit = async () => {
    if (isGameOver) return;
    stopTimer();
    const finalTime = time;
    
    // Check solution
    let isCorrect = true;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c].value !== parseInt(puzzle.solution_string[r * 9 + c])) {
          isCorrect = false;
          break;
        }
      }
      if (!isCorrect) break;
    }

    if (isCorrect) {
      setIsGameOver(true); // <-- Set game over
      const submission: SubmissionData = {
        puzzle_id: puzzle.id,
        puzzle_type: 'sudoku',
        time_taken_ms: finalTime,
        tries: 1,
      };
      const result = await submitPuzzle(submission); // This will now clear the mock
      setGameResult(result);
    } else {
      alert("Solution is incorrect. Please check for errors (in red).");
      startTimer(); // Resume timer if wrong
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage={true} />;
  }

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-4">Sudoku</h1>

      <div className="mb-4">
        <Timer timeMs={time} />
      </div>
      
      <SudokuGrid 
        grid={grid}
        selectedCell={selectedCell}
        onCellClick={handleCellClick}
      />
      <NumberPad 
        isNoteMode={isNoteMode}
        onNoteToggle={() => setIsNoteMode(!isNoteMode)}
        onNumberClick={handleNumberClick}
        onEraseClick={handleEraseClick}
      />
      <button 
        onClick={handleSubmit}
        className="mt-6 px-8 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700"
      >
        Submit Solution
      </button>

      {gameResult && (
        <PostGameResultsModal
          score={gameResult.score}
          onClose={() => setGameResult(null)}
        />
      )}
    </div>
  );
};