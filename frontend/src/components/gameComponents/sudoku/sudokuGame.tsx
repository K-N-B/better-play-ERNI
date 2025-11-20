// ========== FILE 1: src/components/gameComponents/sudoku/sudokuGame.tsx ==========
// UPDATED WITH CHALLENGE SUPPORT

import { useState, useEffect, useCallback } from "react";
import {
  submitPuzzle,
  getSavedAttempt,
  saveProgress,
  checkSubmissionExists,
  getGameLimits,
} from "../../../api/gameService";
// import { completeChallenge } from "../../../api/challengeService";
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
import { keyboardInputSudoku } from "./keyboardInputsSudoku";

import { calculateSpeedBonus } from "../../../utils/SpeedBonus"; // Import the utility function

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

export const SudokuGame = ({
  puzzle,
  difficulty,
  challengeId,
}: SudokuGameProps) => {
  const { refreshChallenges } = useChallenges();
  const initialPuzzleString =
    difficulty === "easy"
      ? puzzle.puzzle_string_easy
      : puzzle.puzzle_string_hard;

  const [grid, setGrid] = useState<SudokuCell[][]>(() =>
    parseGrid(initialPuzzleString)
  );
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<{
    score: number;
    submissionId: number | null;
  } | null>(null);

  const [hintsUsed, setHintsUsed] = useState(0);
  const [maxHints, setMaxHints] = useState<number>(3);

  // fetch hint limits on mount or difficulty change
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

  const [isHintLoading, setIsHintLoading] = useState(false);

  const [alreadyCompleted, setAlreadyCompleted] = useState<{
    hasSubmitted: boolean;
    score?: number;
    submittedAt?: string;
    submissionId?: number;
  } | null>(null);

  const [checkingSubmission, setCheckingSubmission] = useState(true);

  const { time, startTimer, stopTimer, setSavedTime } = useTimer();

  // Fetch the limits for Sudoku (max time, BASCORE, etc.)
  const fetchLimits = useCallback(
    () => getGameLimits("sudoku"),
    [] // Sudoku type is constant here
  );
  const { data: gameConfig, loading: configLoading } = useApi(fetchLimits);

  // Check for existing submission FIRST
  useEffect(() => {
    if (!puzzle?.date_to_be_used || !puzzle?.id) {
      setCheckingSubmission(false);
      return;
    }

    setCheckingSubmission(true);

    checkSubmissionExists("sudoku", puzzle.date_to_be_used, puzzle.id)
      .then(async (result) => {
        if (result.hasSubmitted) {
          setAlreadyCompleted(result);

          // ✅ NEW: Auto-complete challenge if already submitted

          if (challengeId && result.submissionId) {
            try {
            } catch (error) {
              console.error(
                "[SudokuGame] ❌ Failed to auto-complete challenge:",
                error
              );
            }
          } else {
            console.log("[SudokuGame] ❌ NOT completing challenge because:");
            if (!challengeId)
              console.log("[SudokuGame]   - challengeId is missing/falsy");
            if (!result.submissionId)
              console.log(
                "[SudokuGame]   - result.submissionId is missing/falsy"
              );
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
    if (alreadyCompleted?.hasSubmitted || loading) return; // Wait for loading to complete

    let loadedIsGameOver = false;

    if (savedGame && savedGame.puzzle_type === "sudoku") {
      const progressData = savedGame.progress_data;
      const savedGrid = progressData?.grid || progressData;

      if (savedGrid && Array.isArray(savedGrid)) {
        setGrid(savedGrid);
        if (progressData?.hints_used) {
          setHintsUsed(progressData.hints_used);
        } // 1. Set the saved time from the database

        setSavedTime(savedGame.time_spent_ms); // Check if grid is already solved

        loadedIsGameOver = checkSolution(savedGrid, puzzle.solution_string); // Logic for resume modal / progress can remain, but the startTimer logic is simplified.
      }
    }

    if (!loadedIsGameOver) {
      startTimer();
    } // 3. Ensure the timer stops if the game is already completed on load.
    return () => {
      if (!loadedIsGameOver) {
        stopTimer();
      }
    };
  }, [
    savedGame,
    loading, // Added dependency to wait for loading state
    startTimer,
    setSavedTime,
    puzzle.solution_string,
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
    [puzzle, time, difficulty, isGameOver, alreadyCompleted, hintsUsed]
  );

  // Event Handlers

  const handleSubmit = async () => {
    if (isGameOver || alreadyCompleted?.hasSubmitted) return;

    const isCorrect = checkSolution(grid, puzzle.solution_string);

    if (!isCorrect) {
      alert("Solution is incorrect. Keep trying or check for errors (in red).");
      return;
    }
    if (!gameConfig) {
      console.error("Game configuration (limits/points) not loaded.");
      alert("Cannot submit: Game configuration is missing.");
      return;
    }

    console.log("[SudokuGame] ========== SUBMITTING PUZZLE ==========");
    console.log("[SudokuGame] challengeId:", challengeId);

    setIsGameOver(true);
    stopTimer();
    const finalTime = time;
    let finalScore = 0;
    let submissionIdForResultModal: number | null = null;

    if (!puzzle?.date_to_be_used || !puzzle?.id) {
      setGameResult({ score: 0, submissionId: null });
      return;
    }
    // --- 🚀 NEW SPEED BONUS CALCULATION START 🚀 ---
    const difficultyKey = difficulty.toUpperCase();

    // Look up the limits from the fetched config
    const maxTimeMs = gameConfig?.TIME_LIMITS_MS?.[difficultyKey] || 0;
    const basePoints = gameConfig?.BASE_POINTS?.[difficultyKey] || 0;

    // Assuming HINT_PENALTY_POINTS is part of gameConfig or a stable constant
    const HINT_PENALTY = 20; // Use a constant if not in gameConfig, or fetch it.
    const penalty = hintsUsed * HINT_PENALTY; // hintsUsed is a state variable
    const scoreAfterPenalty = Math.max(0, basePoints - penalty);

    const speedBonus = calculateSpeedBonus(finalTime, maxTimeMs);

    const calculatedScore = scoreAfterPenalty + speedBonus; // Store the calculated score

    console.log(
      `[SudokuGame] Base: ${basePoints}, Bonus: ${speedBonus}, Total Calculated: ${calculatedScore}`
    );
    // --- 🚀 NEW SPEED BONUS CALCULATION END 🚀 ---

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
        status: "SOLVED",
      };

      const submissionResult = await submitPuzzle(
        submissionData,
        puzzle.date_to_be_used,
        puzzle.id
      );

      finalScore = calculatedScore;
      submissionIdForResultModal = submissionResult.submissionId ?? null;

      // ✅ NEW: Complete challenge
      console.log("[SudokuGame] ========== AFTER SUBMISSION ==========");
      console.log("[SudokuGame] challengeId:", challengeId);
      console.log(
        "[SudokuGame] submissionIdForResultModal:",
        submissionIdForResultModal
      );
      console.log(
        "[SudokuGame] Both truthy?:",
        !!(challengeId && submissionIdForResultModal)
      );

      if (challengeId && submissionIdForResultModal) {
        try {
          console.log(
            "[SudokuGame] ========== CHALLENGE COMPLETION START =========="
          );
          // const challengeResult = await completeChallenge(challengeId, {
          //   submission_id: submissionIdForResultModal,
          // });
          console.log("[SudokuGame] ✅ Challenge API call succeeded!");
          await new Promise((resolve) => setTimeout(resolve, 3000));
          await refreshChallenges();
          console.log("[SudokuGame] ✅ Challenge flow complete!");
          console.log(
            "[SudokuGame] ========== CHALLENGE COMPLETION END =========="
          );
        } catch (challengeError) {
          console.error("[SudokuGame] ❌ Challenge error:", challengeError);
          await refreshChallenges();
        }
      } else {
        console.log("[SudokuGame] ❌ NOT completing challenge because:");
        if (!challengeId)
          console.log("[SudokuGame]   - challengeId is missing/falsy");
        if (!submissionIdForResultModal)
          console.log(
            "[SudokuGame]   - submissionIdForResultModal is missing/falsy"
          );
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

  const handleInputCore = useCallback(
    (value: number | null) => {
      if (!selectedCell || isGameOver || alreadyCompleted?.hasSubmitted) return;
      const { row, col } = selectedCell;
      const cell = grid[row][col];

      if (cell.isGiven || cell.isHint) return; // Cannot modify given or hinted cells

      // Create a deep copy of the grid for immutability
      const newGrid = grid.map((r) => r.map((c) => ({ ...c })));
      const targetCell = newGrid[row][col];

      if (value === null) {
        // --- Erase Logic (Handles 0, Delete, Backspace) ---
        targetCell.value = null;
        targetCell.notes = [];
      } else if (isNoteMode) {
        // --- Note Mode Logic ---
        const noteIndex = targetCell.notes.indexOf(value);
        if (noteIndex > -1) {
          targetCell.notes.splice(noteIndex, 1); // Remove note
        } else {
          targetCell.notes.push(value); // Add note
          targetCell.notes.sort((a, b) => a - b);
        }
        targetCell.value = null; // Clear value when toggling notes
      } else {
        // --- Value Mode Logic (Number Click) ---
        targetCell.value = targetCell.value === value ? null : value;
        targetCell.notes = [];
      }

      // Check and save the updated grid
      const checkedGrid = checkGridForErrors(newGrid);
      setGrid(checkedGrid);
      // You should use the proper save function defined elsewhere in your component
      // If your helper is `saveImmediately`, then use it here.
      saveImmediately(checkedGrid);
    },
    [
      selectedCell,
      isGameOver,
      alreadyCompleted,
      grid,
      isNoteMode,
      checkGridForErrors,
      countFilledCells,
      puzzle.solution_string,
      handleSubmit,
      saveImmediately,
    ]
  );
  keyboardInputSudoku({
    grid,
    selectedCell,
    isGameOver,
    isNoteMode,
    alreadyCompleted, // Passed to hook
    setSelectedCell, // Passed to hook
    setIsNoteMode, // Passed to hook
    handleInputCore, // Passed to hook
  });

  // ⭐️ MODIFIED: Existing button handlers now point to the core logic ⭐️
  const handleNumberClick = (num: number) => {
    handleInputCore(num);
  };

  const handleEraseClick = () => {
    handleInputCore(null); // Erase is null input
  };

  const handleCellClick = (row: number, col: number) => {
    if (isGameOver || grid[row][col].isGiven || alreadyCompleted?.hasSubmitted)
      return;
    setSelectedCell({ row, col });
  };

  const handleGetHint = async () => {
    if (isHintLoading) return;
    try {
      setIsHintLoading(true);
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
    } finally {
      setIsHintLoading(false); // 4. Reset loading state
    }
  };

  // ==========================================
  // 📊 PROGRESS BAR LOGIC
  // ==========================================
  
  // 1. Get Config Values safely
  const difficultyKey = difficulty.toUpperCase();
  const basePoints = gameConfig?.BASE_POINTS?.[difficultyKey] || 0;
  const maxTimeMs = gameConfig?.TIME_LIMITS_MS?.[difficultyKey] || 1; // Avoid divide by zero
  
  // 2. Calculate Dynamic Values
  const currentSpeedBonus = calculateSpeedBonus(time, maxTimeMs);
  const HINT_PENALTY_VALUE = 20; // As per your description
  const currentHintPenalty = hintsUsed * HINT_PENALTY_VALUE;
  
  // 3. Calculate Totals
  // Max possible is Base + Max Bonus (100)
  const maxPossibleScore = basePoints + 100; 
  
  // Current potential is Base + Current Bonus - Penalties
  // We use Math.max(0, ...) to ensure we don't show negative points
  const currentPotentialScore = Math.max(0, basePoints + currentSpeedBonus - currentHintPenalty);
  
  // 4. Calculate Bar Percentage
  const progressPercentage = maxPossibleScore > 0 
    ? (currentPotentialScore / maxPossibleScore) * 100 
    : 0;
    
  // // Define bar color based on percentage (optional visual flair)
  // const getBarColor = () => {
  //   if (progressPercentage > 66) return "bg-green-500";
  //   if (progressPercentage > 33) return "bg-yellow-500";
  //   return "bg-red-500";
  // };

  if (checkingSubmission || loading || configLoading) {
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
        <div className="w-full flex justify-center items-center p-10 sm:p-15 bg-white rounded-3xl shadow-sm">
          <SudokuGrid
            grid={grid}
            selectedCell={selectedCell}
            onCellClick={handleCellClick}
          />
        </div>
        <div className="place-content-center p-20 text-xl leading-5">
          <div className="flex justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold">Sudoku</h1>
              <p>on {difficulty} difficulty</p>
            </div>
            <Timer timeMs={time} />
          </div>

          {/* Score Progress Bar Section */}
          <div className="mb-6 w-full">
            <div className="flex justify-between text-sm font-bold text-black mb-1">
              <span>Potential Score</span>
              <span>{currentPotentialScore} / {maxPossibleScore} pts</span>
            </div>
            
            {/* The Bar Container */}
            <div className="w-full bg-white rounded-full h-4 overflow-hidden">
              {/* The Fill */}
              <div
                className={` bg-pink-400 h-4 rounded-full transition-all duration-700 ease-in-out relative`}
                style={{ width: `${progressPercentage}%` }}
              >
                {/* Optional: Shine effect */}
                {/* <div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-b from-white/20 to-transparent"></div> */}
              </div>
            </div>

            {/* Legend / Breakdown */}
            <div className="flex justify-between text-xs mt-1 text-gray-500">
              <span className="text-pink-700 font-medium">Base: {basePoints}</span>
              <span className="text-green-700 font-medium">Speed Bonus: +{currentSpeedBonus}</span>
              <span className={`${hintsUsed > 0 ? 'text-red-700 font-medium' : ''}`}>
                Hints: -{currentHintPenalty}
              </span>
            </div>
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
              className="mt-6 px-8 py-3 bg-yellow-500 shadow-yellow-700 text-white font-bold rounded-lg shadow-[0_5px_0_0] hover:shadow-[0_3px_0_0] active:shadow-[0_1px_0_0] hover:translate-y-1 active:translate-y-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hint ({hintsUsed}/{maxHints})
            </button>

            <button
              onClick={handleSubmit}
              disabled={isGameOver}
              className="mt-6 px-8 py-3 bg-green-600 shadow-green-900 text-white font-bold rounded-lg shadow-[0_5px_0_0] hover:shadow-[0_3px_0_0] active:shadow-[0_1px_0_0] hover:translate-y-1 active:translate-y-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
              puzzleId={puzzle.id}
              dailyPuzzleDate={puzzle.date_to_be_used}
              onClose={() => setGameResult(null)}
            />
          )}
        </div>
      </div>
    </>
  );
};

// ========== FILE 2: Continue in next artifact due to length... ==========
