// ========== FILE 1: src/components/gameComponents/sudoku/sudokuGame.tsx ==========
// UPDATED WITH CHALLENGE SUPPORT

import { useState, useEffect, useCallback } from "react";
import {
  submitPuzzle,
  getSavedAttempt,
  saveProgress,
  checkSubmissionExists,
} from "../../../api/gameService";
import { completeChallenge } from "../../../api/challengeService";
import type {
  SudokuPuzzle,
  PuzzleAttemptData,
  SubmissionData,
} from "../../../types/game";

interface SudokuCell {
  value: number | null;
  isGiven: boolean;
  isError: boolean;
  isHint: boolean;
  notes: number[];
}
import { SudokuGrid } from "./sudokuGrid";
import { NumberPad } from "./numberPad";
import { PostGameResultsModal } from "../../ui/postGameResultsModal";
import { AlreadyPlayedScreen } from "../shared/alreadyPlayedScreen";
// import { ResumeGameModal } from "../../ui/resumeGameModal";
import { useTimer } from "../../../hooks/useTimer";
import { Timer } from "../../ui/timer";
import { useApi } from "../../../hooks/useApi";
import { LoadingSpinner } from "../../ui/loadingSpinner";
import type { Difficulty } from "../../../pages/gamePage";
import { getHint, getSudokuHintLimits } from "../../../api/gameService";
import { useChallenges } from "../../../context/ChallengeContext";

// Helper Functions
const parseGrid = (puzzleString: string): SudokuCell[][] => {
  return Array.from({ length: 9 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => {
      const val = parseInt(puzzleString[r * 9 + c]);
      return {
        value: val || null,
        isGiven: !!val,
        isError: false,
        isHint: false,
        notes: [],
      };
    })
  );
};

const checkGridForErrors = (grid: SudokuCell[][]): SudokuCell[][] => {
  const newGrid = grid.map((row) =>
    row.map((cell) => ({ ...cell, isError: false }))
  );
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

const checkSolution = (
  currentGrid: SudokuCell[][],
  solutionString: string
): boolean => {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const expectedValue = parseInt(solutionString[r * 9 + c]);
      if (
        !currentGrid[r][c].value ||
        currentGrid[r][c].value !== expectedValue
      ) {
        return false;
      }
    }
  }
  return true;
};

const countFilledCells = (grid: SudokuCell[][]): number => {
  let count = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c].value !== null) count++;
    }
  }
  return count;
};

interface SudokuGameProps {
  puzzle: SudokuPuzzle;
  difficulty: Difficulty;
  challengeId: number | null;
}

export const SudokuGame = ({ puzzle, difficulty, challengeId }: SudokuGameProps) => {
  // ✅ DEBUG: Component mounted
  console.log('[SudokuGame] ========== COMPONENT MOUNTED ==========');
  console.log('[SudokuGame] Props received:');
  console.log('[SudokuGame]   - challengeId:', challengeId, '(type:', typeof challengeId, ')');
  console.log('[SudokuGame]   - difficulty:', difficulty);
  console.log('[SudokuGame]   - puzzle.id:', puzzle?.id);
  console.log('[SudokuGame] ===========================================');
  
  const { refreshChallenges } = useChallenges();
  const initialPuzzleString = difficulty === 'easy' ? puzzle.puzzle_string_easy : puzzle.puzzle_string_hard;
  
  const [grid, setGrid] = useState<SudokuCell[][]>(() => parseGrid(initialPuzzleString));
  const [selectedCell, setSelectedCell] = useState<{ row: number, col: number } | null>(null);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<{
    score: number;
    submissionId: number | null;
  } | null>(null);

  const [hintsUsed, setHintsUsed] = useState(0);
  const [maxHints, setMaxHints] = useState<number>(3);

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const limits = await getSudokuHintLimits();
        const difficultyUpper = difficulty.toUpperCase();

        // ✅ Simplified: set max hints dynamically from backend, with fallback
        setMaxHints(limits.HINT_LIMITS?.[difficultyUpper] ?? 3);
      } catch (error) {
        console.error("Failed to fetch Sudoku hint limits:", error);
        setMaxHints(3); // fallback if backend call fails
      }
    };

    fetchLimits();
  }, [difficulty]);

  // const [showResumeModal, setShowResumeModal] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState<{
    hasSubmitted: boolean;
    score?: number;
    submittedAt?: string;
    submissionId?: number;
  } | null>(null);
  const [checkingSubmission, setCheckingSubmission] = useState(true);

  const { time, startTimer, stopTimer, setSavedTime } = useTimer();

  // Check for existing submission FIRST
  useEffect(() => {
    if (!puzzle?.date_to_be_used || !puzzle?.id) {
      setCheckingSubmission(false);
      return;
    }
    
    console.log('[SudokuGame] ========== CHECKING SUBMISSION ==========');
    console.log('[SudokuGame] challengeId:', challengeId);
    setCheckingSubmission(true);
    
    checkSubmissionExists('sudoku', puzzle.date_to_be_used, puzzle.id)
      .then(async result => {
        console.log('[SudokuGame] Submission check result:', result);
        console.log('[SudokuGame] result.hasSubmitted:', result.hasSubmitted);
        console.log('[SudokuGame] result.submissionId:', result.submissionId);
        
        if (result.hasSubmitted) {
          setAlreadyCompleted(result);
          setIsGameOver(true);
          
          // ✅ NEW: Auto-complete challenge if already submitted
          console.log('[SudokuGame] ========== SHOULD COMPLETE CHALLENGE? ==========');
          console.log('[SudokuGame] challengeId:', challengeId);
          console.log('[SudokuGame] result.submissionId:', result.submissionId);
          console.log('[SudokuGame] Both truthy?:', !!(challengeId && result.submissionId));
          
          if (challengeId && result.submissionId) {
            console.log('[SudokuGame] ⚠️ User already submitted - completing challenge now!');
            try {
              console.log('[SudokuGame] ========== CHALLENGE COMPLETION START ==========');
              const challengeResult = await completeChallenge(challengeId, { submission_id: result.submissionId });
              console.log('[SudokuGame] ✅ Challenge completed automatically!');
              await new Promise(resolve => setTimeout(resolve, 2000));
              await refreshChallenges();
              console.log('[SudokuGame] ========== CHALLENGE COMPLETION END ==========');
            } catch (error) {
              console.error('[SudokuGame] ❌ Failed to auto-complete challenge:', error);
            }
          } else {
            console.log('[SudokuGame] ❌ NOT completing challenge because:');
            if (!challengeId) console.log('[SudokuGame]   - challengeId is missing/falsy');
            if (!result.submissionId) console.log('[SudokuGame]   - result.submissionId is missing/falsy');
          }
        }
      })
      .catch((err) => console.error("[SudokuGame] Check failed:", err))
      .finally(() => setCheckingSubmission(false));
  }, [puzzle?.date_to_be_used, puzzle?.id, challengeId, refreshChallenges]);

  // Fetch saved game
  const fetchSavedSudoku = useCallback(() => {
    if (
      !puzzle?.date_to_be_used ||
      !puzzle?.id ||
      alreadyCompleted?.hasSubmitted
    ) {
      return Promise.resolve(null);
    }
    return getSavedAttempt(
      "sudoku",
      puzzle.date_to_be_used,
      puzzle.id.toString()
    );
  }, [puzzle?.date_to_be_used, puzzle?.id, alreadyCompleted]);

  const { data: savedGame, loading } = useApi(fetchSavedSudoku);

  // Load saved progress
  useEffect(() => {
    if (alreadyCompleted?.hasSubmitted) return;

    let loadedIsGameOver = false;
    if (savedGame && savedGame.puzzle_type === "sudoku") {
      // ✅ Handle both old format (direct grid) and new format (wrapped object)
      const progressData = savedGame.progress_data;
      const savedGrid = progressData?.grid || progressData;

      if (savedGrid && Array.isArray(savedGrid)) {
        setGrid(savedGrid);
        if (progressData?.hints_used) {
          setHintsUsed(progressData.hints_used);
        }
        setSavedTime(savedGame.time_spent_ms);

        // Check if grid is already solved
        loadedIsGameOver = checkSolution(savedGrid, puzzle.solution_string);
        setIsGameOver(loadedIsGameOver);

        // Show resume modal if user has made progress
        const filledCells = countFilledCells(savedGrid);
        const hasProgress =
          filledCells > countFilledCells(parseGrid(initialPuzzleString)) ||
          savedGame.time_spent_ms > 5000;

        if (hasProgress && !loadedIsGameOver) {
          // console.log("[SudokuGame] Showing resume modal");
          // setShowResumeModal(true);
        } else if (!loadedIsGameOver) {
          console.log("[SudokuGame] Starting timer - no resume needed");
          startTimer();
        }
      }
    } else if (!loadedIsGameOver) {
      startTimer();
    }
  }, [
    savedGame,
    startTimer,
    setSavedTime,
    puzzle.solution_string,
    initialPuzzleString,
    alreadyCompleted,
  ]);

  // Auto-save progress
  useEffect(() => {
    if (
      loading ||
      isGameOver ||
      alreadyCompleted?.hasSubmitted ||
      !puzzle?.date_to_be_used ||
      !puzzle?.id
    )
      return;

    const saveTimer = setTimeout(() => {
      const dataPayload: PuzzleAttemptData = {
        puzzle_id: puzzle.id,
        puzzle_type: "sudoku",
        progress_data: { grid: grid, hints_used: hintsUsed }, // Wrap grid in object
        time_spent_ms: time,
        difficulty: difficulty,
      };

      console.log("[SudokuGame] Auto-saving progress...");
      saveProgress(dataPayload, puzzle.date_to_be_used, puzzle.id)
        .then(() => console.log("[SudokuGame] ✅ Auto-save successful"))
        .catch((err) =>
          console.error("[SudokuGame] ❌ Auto-save failed:", err)
        );
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [
    grid,
    isGameOver,
    time,
    loading,
    puzzle?.id,
    puzzle?.date_to_be_used,
    difficulty,
    alreadyCompleted,
  ]);

  // Save immediately when user inputs a number
  const saveImmediately = useCallback(
    (newGrid: SudokuCell[][]) => {
      if (
        !puzzle?.date_to_be_used ||
        !puzzle?.id ||
        isGameOver ||
        alreadyCompleted?.hasSubmitted
      )
        return;

      const dataPayload: PuzzleAttemptData = {
        puzzle_id: puzzle.id,
        puzzle_type: "sudoku",
        progress_data: { grid: newGrid, hints_used: hintsUsed },
        time_spent_ms: time,
        difficulty: difficulty,
      };

      console.log("[SudokuGame] Saving immediately after input");
      saveProgress(dataPayload, puzzle.date_to_be_used, puzzle.id)
        .then(() => console.log("[SudokuGame] ✅ Immediate save successful"))
        .catch((err) =>
          console.error("[SudokuGame] ❌ Immediate save failed:", err)
        );
    },
    [puzzle, time, difficulty, isGameOver, alreadyCompleted]
  );

  // Event Handlers
  const handleCellClick = (row: number, col: number) => {
    if (isGameOver || grid[row][col].isGiven || alreadyCompleted?.hasSubmitted)
      return;
    setSelectedCell({ row, col });
  };

  const handleNumberClick = (num: number) => {
    if (!selectedCell || isGameOver || alreadyCompleted?.hasSubmitted) return;
    const { row, col } = selectedCell;
    if (grid[row][col].isGiven) return;

    const newGrid = grid.map((r, ri) =>
      r.map((c, ci) => (ri === row && ci === col ? { ...c } : c))
    );
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

    const checkedGrid = checkGridForErrors(newGrid);
    setGrid(checkedGrid);
    saveImmediately(checkedGrid);
  };

  const handleEraseClick = () => {
    if (!selectedCell || isGameOver || alreadyCompleted?.hasSubmitted) return;
    const { row, col } = selectedCell;
    if (grid[row][col].isGiven) return;

    const newGrid = grid.map((r, ri) =>
      r.map((c, ci) => (ri === row && ci === col ? { ...c } : c))
    );
    newGrid[row][col].value = null;
    newGrid[row][col].notes = [];

    const checkedGrid = checkGridForErrors(newGrid);
    setGrid(checkedGrid);
    saveImmediately(checkedGrid);
  };

  const handleSubmit = async () => {
    if (isGameOver || alreadyCompleted?.hasSubmitted) return;

    const isCorrect = checkSolution(grid, puzzle.solution_string);

    if (!isCorrect) {
      alert("Solution is incorrect. Keep trying or check for errors (in red).");
      return;
    }

    console.log('[SudokuGame] ========== SUBMITTING PUZZLE ==========');
    console.log('[SudokuGame] challengeId:', challengeId);

    setIsGameOver(true);
    stopTimer();
    const finalTime = time;
    let finalScore = 0;
    let submissionIdForResultModal: number | null = null;

    if (!puzzle?.date_to_be_used || !puzzle?.id) {
      setGameResult({ score: 0, submissionId: null });
      return;
    }

    try {
      // ✅ Convert grid to string format for backend validation
      let finalGridString = "";
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          finalGridString += (grid[r][c].value || 0).toString();
        }
      }

      const finalProgressData = {
        grid: grid, // Keep grid for resume functionality
        final_grid: finalGridString, // Add string format for validation
        hints_used: hintsUsed, // TODO: Track hints when implemented
        status: "SOLVED",
      };

      await saveProgress(
        {
          puzzle_id: puzzle.id,
          puzzle_type: "sudoku",
          progress_data: finalProgressData,
          time_spent_ms: finalTime,
          difficulty: difficulty,
        },
        puzzle.date_to_be_used,
        puzzle.id
      );

      await new Promise((resolve) => setTimeout(resolve, 500));

      const submissionData: SubmissionData = {
        puzzle_id: puzzle.id,
        puzzle_type: "sudoku",
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

      // ✅ NEW: Complete challenge
      console.log('[SudokuGame] ========== AFTER SUBMISSION ==========');
      console.log('[SudokuGame] challengeId:', challengeId);
      console.log('[SudokuGame] submissionIdForResultModal:', submissionIdForResultModal);
      console.log('[SudokuGame] Both truthy?:', !!(challengeId && submissionIdForResultModal));

      if (challengeId && submissionIdForResultModal) {
        try {
          console.log('[SudokuGame] ========== CHALLENGE COMPLETION START ==========');
          const challengeResult = await completeChallenge(challengeId, { submission_id: submissionIdForResultModal });
          console.log('[SudokuGame] ✅ Challenge API call succeeded!');
          await new Promise(resolve => setTimeout(resolve, 3000));
          await refreshChallenges();
          console.log('[SudokuGame] ✅ Challenge flow complete!');
          console.log('[SudokuGame] ========== CHALLENGE COMPLETION END ==========');
        } catch (challengeError) {
          console.error('[SudokuGame] ❌ Challenge error:', challengeError);
          await refreshChallenges();
        }
      } else {
        console.log('[SudokuGame] ❌ NOT completing challenge because:');
        if (!challengeId) console.log('[SudokuGame]   - challengeId is missing/falsy');
        if (!submissionIdForResultModal) console.log('[SudokuGame]   - submissionIdForResultModal is missing/falsy');
      }
    } catch (err) {
      console.error("[SudokuGame] Error:", err);
    } finally {
      setGameResult({
        score: finalScore,
        submissionId: submissionIdForResultModal,
      });
    }
  };

  // const handleContinue = () => {
  //   setShowResumeModal(false);
  //   startTimer();
  // };

  const handleGetHint = async () => {
    try {
      const dataPayload: PuzzleAttemptData = {
        puzzle_id: puzzle.id,
        puzzle_type: "sudoku",
        progress_data: { grid },
        time_spent_ms: time,
        difficulty,
      };

      await saveProgress(dataPayload, puzzle.date_to_be_used, puzzle.id);

      // ✅ Request hint from backend
      const result = await getHint(
        puzzle.date_to_be_used,
        "sudoku",
        puzzle.id,
        difficulty.toUpperCase()
      );

      const { hint_index, hint_value, hints_used_new } = result;
      const row = Math.floor(hint_index / 9);
      const col = hint_index % 9;

      // ✅ Update grid AND save the updated version
      setGrid((prevGrid) => {
        const newGrid = prevGrid.map((r) => r.map((cell) => ({ ...cell })));
        newGrid[row][col].value = parseInt(hint_value);
        newGrid[row][col].isHint = true;

        // Save the **new** grid to backend
        saveProgress(
          {
            puzzle_id: puzzle.id,
            puzzle_type: "sudoku",
            progress_data: { grid: newGrid, hints_used: hints_used_new },
            time_spent_ms: time,
            difficulty,
          },
          puzzle.date_to_be_used,
          puzzle.id
        );

        return newGrid;
      });

      setHintsUsed(hints_used_new);
    } catch (error) {
      console.error("[handleGetHint] Failed to get hint:", error);
      alert(`Failed to get hint: ${(error as Error).message}`);
    }
  };

  if (checkingSubmission || loading) {
    return <LoadingSpinner fullPage={true} />;
  }

  if (alreadyCompleted?.hasSubmitted) {
    return (
      <AlreadyPlayedScreen
        gameType="sudoku"
        score={alreadyCompleted.score || 0}
        submittedAt={alreadyCompleted.submittedAt || new Date().toISOString()}
        difficulty={difficulty}
      />
    );
  }

  // const filledCells = countFilledCells(grid);
  // const totalCells = 81;

  return (
    <>
      {/* {showResumeModal && (
        <ResumeGameModal
          guessCount={filledCells}
          maxGuesses={totalCells}
          puzzleDate={puzzle.date_to_be_used}
          puzzleNumber={puzzle.id}
          editor="ERNI Team"
          onContinue={handleContinue}
        />
      )} */}

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
              onClick={handleGetHint}
              disabled={isGameOver || hintsUsed >= maxHints}
              className="mt-6 px-8 py-3 bg-yellow-500 text-white font-bold rounded-lg shadow-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hint ({hintsUsed}/{maxHints})
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
              // currentStreak={gameResult.currentStreak}
              gameType="sudoku"
              onClose={() => setGameResult(null)}
            />
          )}
        </div>
      </div>
    </>
  );
};

// ========== FILE 2: Continue in next artifact due to length... ==========
