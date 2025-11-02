// src/components/gameComponents/sudoku/sudokuGame.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { submitPuzzle, getSavedAttempt, saveProgress } from '../../../api/gameService';
import { completeChallenge } from '../../../api/challengeService';
import type { SudokuPuzzle, SudokuCell, PuzzleAttemptData, SubmissionData } from '../../../types/game';
import { SudokuGrid } from './sudokuGrid';
import { NumberPad } from './numberPad';
import { PostGameResultsModal } from '../../ui/postGameResultsModal';
import { useTimer } from '../../../hooks/useTimer';
import { Timer } from '../../ui/timer';
import { useApi } from '../../../hooks/useApi';
import { LoadingSpinner } from '../../ui/loadingSpinner';
import type { Difficulty } from '../../../pages/gamePage';

// Helper Functions
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
    const row = new Set<number>();
    const col = new Set<number>();
    const box = new Set<number>();
    for (let j = 0; j < 9; j++) {
      const rowVal = newGrid[i][j].value;
      if (rowVal) {
        if (row.has(rowVal)) newGrid[i][j].isError = true;
        row.add(rowVal);
      }
      const colVal = newGrid[j][i].value;
      if (colVal) {
        if (col.has(colVal)) newGrid[j][i].isError = true;
        col.add(colVal);
      }
      const boxRow = Math.floor(i / 3) * 3 + Math.floor(j / 3);
      const boxCol = (i % 3) * 3 + (j % 3);
      const boxVal = newGrid[boxRow][boxCol].value;
      if (boxVal) {
        if (box.has(boxVal)) newGrid[boxRow][boxCol].isError = true;
        box.add(boxVal);
      }
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
  const initialPuzzleString = difficulty === 'easy' ? puzzle.puzzle_string_easy : puzzle.puzzle_string_hard;
  const [grid, setGrid] = useState<SudokuCell[][]>(() => parseGrid(initialPuzzleString));
  const [selectedCell, setSelectedCell] = useState<{ row: number, col: number } | null>(null);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<{ score: number; submissionId: number | null } | null>(null);

  const { time, startTimer, stopTimer, setSavedTime } = useTimer();

  // ✅ FIX: Fetch saved attempt with correct parameters
  const fetchSavedSudoku = useCallback(() => {
    if (!puzzle?.date_to_be_used || !puzzle?.id) {
      console.warn('[SudokuGame] Missing puzzle date or ID, skipping saved attempt fetch');
      return Promise.resolve(null);
    }
    return getSavedAttempt('sudoku', puzzle.date_to_be_used, puzzle.id.toString());
  }, [puzzle?.date_to_be_used, puzzle?.id]);

  const { data: savedGame, loading } = useApi(fetchSavedSudoku);

  // Load saved progress
  useEffect(() => {
    let loadedIsGameOver = false;
    if (savedGame && savedGame.puzzle_type === 'sudoku') {
      const savedGrid = savedGame.progress_data as SudokuCell[][];
      setGrid(savedGrid);
      setSavedTime(savedGame.time_spent_ms);
    }
    if (!loadedIsGameOver) {
      startTimer();
    }
  }, [savedGame, startTimer, setSavedTime]);

  // ✅ FIX: Auto-save with correct parameters
  useEffect(() => {
    if (loading || isGameOver || !puzzle?.date_to_be_used || !puzzle?.id || !difficulty) return;

    const saveTimer = setTimeout(() => {
      const dataPayload: PuzzleAttemptData = {
        puzzle_id: puzzle.id,
        puzzle_type: 'sudoku',
        progress_data: grid,
        time_spent_ms: time,
        difficulty: difficulty,
      };

      saveProgress(dataPayload, puzzle.date_to_be_used, puzzle.id);
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [grid, isGameOver, time, loading, puzzle?.id, puzzle?.date_to_be_used, difficulty]);

  // Event Handlers
  const handleCellClick = (row: number, col: number) => {
    if (isGameOver || grid[row][col].isGiven) return;
    setSelectedCell({ row, col });
  };

  const handleNumberClick = (num: number) => {
    if (!selectedCell || isGameOver) return;
    const { row, col } = selectedCell;
    if (grid[row][col].isGiven) return;

    const newGrid = grid.map((r, ri) => r.map((c, ci) => (ri === row && ci === col ? { ...c } : c)));
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
    if (grid[row][col].isGiven) return;

    const newGrid = grid.map((r, ri) => r.map((c, ci) => (ri === row && ci === col ? { ...c } : c)));
    newGrid[row][col].value = null;
    newGrid[row][col].notes = [];
    setGrid(checkGridForErrors(newGrid));
  };

  // Check Solution
  const checkSolution = (currentGrid: SudokuCell[][], solutionString: string): boolean => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const expectedValue = parseInt(solutionString[r * 9 + c]);
        if (!currentGrid[r][c].value || currentGrid[r][c].value !== expectedValue) {
          return false;
        }
      }
    }
    return true;
  };

  // ✅ FIX: handleSubmit with correct parameters
  const handleSubmit = async () => {
    if (isGameOver) return;
    stopTimer();
    const finalTime = time;
    let finalScore = 0;
    let submissionIdForResultModal: number | null = null;

    if (!puzzle?.date_to_be_used || !puzzle?.id) {
      console.error('[SudokuGame] Missing puzzle date or ID, cannot submit');
      setGameResult({ score: 0, submissionId: null });
      return;
    }

    const isCorrect = checkSolution(grid, puzzle.solution_string);

    if (isCorrect) {
      setIsGameOver(true);
      try {
        const submissionData: SubmissionData = {
          puzzle_id: puzzle.id,
          puzzle_type: 'sudoku',
          difficulty: difficulty,
          time_taken_ms: finalTime,
          tries: 1,
        };

        const submissionResult = await submitPuzzle(
          submissionData,
          puzzle.date_to_be_used,
          puzzle.id
        );

        finalScore = submissionResult.score;
        submissionIdForResultModal = submissionResult.submissionId ?? null;

        if (challengeId && submissionIdForResultModal) {
          await completeChallenge(challengeId, { submission_id: submissionIdForResultModal });
        }
      } catch (err) {
        console.error("Error during Sudoku submit:", err);
      } finally {
        setGameResult({ score: finalScore, submissionId: submissionIdForResultModal });
      }
    } else {
      alert("Solution is incorrect. Keep trying or check for errors (in red).");
      startTimer();
    }
  };

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
          <div>
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