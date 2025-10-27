import React, { useState, useEffect, useCallback } from 'react';
import { submitPuzzle, getSavedAttempt, saveProgress } from '../../../api/gameService'; // Adjust path
import { completeChallenge } from '../../../api/challengeService';  
import type { SudokuPuzzle, SudokuCell, PuzzleAttemptData, SubmissionData } from '../../../types/game';
import { SudokuGrid } from './sudokuGrid';
import { NumberPad } from './numberPad';
import { PostGameResultsModal } from '../../ui/postGameResultsModal';
import { useTimer } from '../../../hooks/useTimer';
import { Timer } from '../../ui/timer';
import { useApi } from '../../../hooks/useApi';
import { LoadingSpinner } from '../../ui/loadingSpinner';
import type { Difficulty } from '../../../pages/gamePage'; // Adjust path

// Helper Functions (Keep parseGrid, checkGridForErrors)
const parseGrid = (puzzleString: string): SudokuCell[][] => {
  return Array.from({ length: 9 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => {
      const val = parseInt(puzzleString[r * 9 + c]);
      return { value: val || null, isGiven: !!val, isError: false, notes: [] };
    })
  );
};
const checkGridForErrors = (grid: SudokuCell[][]): SudokuCell[][] => {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell, isError: false })));
  for (let i = 0; i < 9; i++) {
    const row = new Set<number>(); const col = new Set<number>(); const box = new Set<number>();
    for (let j = 0; j < 9; j++) {
      const rowVal = newGrid[i][j].value; if (rowVal) { if (row.has(rowVal)) newGrid[i][j].isError = true; row.add(rowVal); }
      const colVal = newGrid[j][i].value; if (colVal) { if (col.has(colVal)) newGrid[j][i].isError = true; col.add(colVal); }
      const boxRow = Math.floor(i / 3) * 3 + Math.floor(j / 3); const boxCol = (i % 3) * 3 + (j % 3);
      const boxVal = newGrid[boxRow][boxCol].value; if (boxVal) { if (box.has(boxVal)) newGrid[boxRow][boxCol].isError = true; box.add(boxVal); }
    }
  }
  return newGrid;
};

interface SudokuGameProps {
  puzzle: SudokuPuzzle;
  difficulty: Difficulty;
  challengeId: number | null;
}

export const SudokuGame = ({ puzzle, difficulty, challengeId }: SudokuGameProps) => {
  const [grid, setGrid] = useState<SudokuCell[][]>(() => parseGrid(puzzle.puzzle_string));
  const [selectedCell, setSelectedCell] = useState<{ row: number, col: number } | null>(null);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<{ score: number; submissionId: number | null } | null>(null);

  const { time, startTimer, stopTimer, setSavedTime } = useTimer();
  const fetchSavedSudoku = useCallback(() => getSavedAttempt('sudoku'), []);
  const { data: savedGame, loading } = useApi(fetchSavedSudoku);

  // Effect to load data
  useEffect(() => {
    let loadedIsGameOver = false;
    if (savedGame && savedGame.puzzle_type === 'sudoku') {
      const savedGrid = savedGame.progress_data as SudokuCell[][];
      setGrid(savedGrid);
      setSavedTime(savedGame.time_spent_ms);
      // Determine if loaded grid is solved (or save isGameOver flag)
      // Check if grid matches solution?
      // loadedIsGameOver = checkSolution(savedGrid, puzzle.solution_string);
      // setIsGameOver(loadedIsGameOver);
    }
     if (!loadedIsGameOver) {
        startTimer();
    }
  }, [savedGame, startTimer, setSavedTime, puzzle.solution_string]); // Added solution string dependency

  // Effect to auto-save
  useEffect(() => {
    if (loading || isGameOver) return;
    const saveTimer = setTimeout(() => {
      saveProgress({
        puzzle_id: puzzle.id,
        puzzle_type: 'sudoku',
        progress_data: grid, // Save grid state
        time_spent_ms: time,
      });
    }, 2000);
    return () => clearTimeout(saveTimer);
  }, [grid, isGameOver, time, loading, puzzle.id]);


  // Event Handlers
  const handleCellClick = (row: number, col: number) => {
    if (isGameOver || grid[row][col].isGiven) return;
    setSelectedCell({ row, col });
  };

  const handleNumberClick = (num: number) => {
    if (!selectedCell || isGameOver) return;
    const { row, col } = selectedCell;
    if (grid[row][col].isGiven) return; // Prevent changing given numbers

    const newGrid = grid.map((r, ri) => r.map((c, ci) => (ri === row && ci === col ? { ...c } : c))); // Copy only the changed cell
    const cell = newGrid[row][col];

    if (isNoteMode) {
      const noteIndex = cell.notes.indexOf(num);
      if (noteIndex > -1) cell.notes.splice(noteIndex, 1);
      else cell.notes.push(num);
      cell.value = null; // Clear value when adding note
    } else {
      cell.value = cell.value === num ? null : num; // Toggle value or clear
      cell.notes = []; // Clear notes when setting value
    }
    setGrid(checkGridForErrors(newGrid));
  };

  const handleEraseClick = () => {
    if (!selectedCell || isGameOver) return;
    const { row, col } = selectedCell;
     if (grid[row][col].isGiven) return;

    const newGrid = grid.map((r, ri) => r.map((c, ci) => (ri === row && ci === col ? { ...c } : c)));
    newGrid[row][col].value = null;
    newGrid[row][col].notes = [];
    setGrid(checkGridForErrors(newGrid));
  };

  // Check Solution function (can be moved to utils)
   const checkSolution = (currentGrid: SudokuCell[][], solutionString: string): boolean => {
      for (let r = 0; r < 9; r++) {
         for (let c = 0; c < 9; c++) {
            const expectedValue = parseInt(solutionString[r * 9 + c]);
            if (!currentGrid[r][c].value || currentGrid[r][c].value !== expectedValue) {
               return false; // Found a mismatch
            }
         }
      }
      return true; // All cells match
   };

  // handleSubmit function
  const handleSubmit = async () => {
    if (isGameOver) return;
    stopTimer();
    const finalTime = time;
    let finalScore = 0;
    let submissionIdForResultModal: number | null = null;

    const isCorrect = checkSolution(grid, puzzle.solution_string);

    if (isCorrect) {
      setIsGameOver(true);
      try {
        const submissionData: SubmissionData = {
          puzzle_id: puzzle.id,
          puzzle_type: 'sudoku',
          time_taken_ms: finalTime,
          tries: 1,
        };
        const submissionResult = await submitPuzzle(submissionData);
        finalScore = submissionResult.score;
        submissionIdForResultModal = submissionResult.submissionId ?? null;

        if (challengeId && submissionIdForResultModal) {
            await completeChallenge(challengeId, { submission_id: submissionIdForResultModal });
        } else if (challengeId) {
             console.error("[SudokuGame] Challenge ID present but failed to get submission ID.");
        }
      } catch (err) {
        console.error("Error during Sudoku submit/challenge:", err);
      } finally {
        setGameResult({ score: finalScore, submissionId: submissionIdForResultModal });
      }
    } else {
      alert("Solution is incorrect. Keep trying or check for errors (in red).");
      startTimer();
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage={true} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 items-center p-4">
      <div className="place-content-center p-20 text-xl leading-6 bg-white h-full rounded-3xl">
        <SudokuGrid
        grid={grid}
        selectedCell={selectedCell}
        onCellClick={handleCellClick}
      />
      </div>
      <div className="place-content-center p-20 text-xl leading-5">
        <div className="flex justify-between mb-10">
          <div className="">
            <h1 className="text-4xl font-bold">Sudoku</h1>
            <p>on {difficulty} difficulty</p>
          
          </div>
          <Timer timeMs={time} />
        </div>

        <NumberPad
          isNoteMode={isNoteMode}
          onNoteToggle={() => !isGameOver && setIsNoteMode(!isNoteMode)}
          onNumberClick={handleNumberClick}
          onEraseClick={handleEraseClick}
        />
        <div className="grid grid-cols-2 gap-4 mt-2">
          <button
          onClick={handleSubmit}
          disabled={isGameOver}
          className="mt-6 px-8 py-3 bg-yellow-500 text-white font-bold rounded-lg shadow-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Hint
        </button>

        <button
          onClick={handleSubmit}
          disabled={isGameOver}
          className="mt-6 px-8 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit
        </button>
        </div>
        

        {gameResult && (
          <PostGameResultsModal
            score={gameResult.score}
            submissionId={gameResult.submissionId}
            onClose={() => setGameResult(null)}
          />
        )}
    
      </div>
    </div>
  );
};