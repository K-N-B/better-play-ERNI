// src/components/gameComponents/wordle/wordleGame.tsx - COMPLETE FILE WITH DEBUG
import confetti from "canvas-confetti";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  submitPuzzle,
  getSavedAttempt,
  saveProgress,
  checkSubmissionExists,
  getGameLimits,
} from "../../../api/gameService";
// import { completeChallenge } from "../../../api/challengeService";
import { useChallenges } from "../../../context/ChallengeContext";
import type {
  WordlePuzzle,
  SubmissionData,
  PuzzleAttemptData,
  WordleProgress,
  KeyStatus,
} from "../../../types/game";
import { WordleGrid } from "./wordleGrid";
import { Keyboard } from "./keyboard";
import { PostGameResultsModal } from "../../ui/postGameResultsModal";
import { AlreadyPlayedScreen } from "../shared/alreadyPlayedScreen";
import { useTimer } from "../../../hooks/useTimer";
import { Timer } from "../../ui/timer";
import { useApi } from "../../../hooks/useApi";
import { LoadingSpinner } from "../../ui/loadingSpinner";
import type { Difficulty } from "../../../pages/gamePage";
import { isValidWord } from "../../../services/wordValidator";

import { useSound } from "../../../hooks/useSound";
import click1 from "@/assets/sounds/keyboard_press_1.mp3";
import click2 from "@/assets/sounds/keyboard_press_2.mp3";
import click3 from "@/assets/sounds/keyboard_press_3.mp3";
import back from "@/assets/sounds/backspace.mp3";
import error from "@/assets/sounds/error.mp3";
import success from "@/assets/sounds/success.mp3";
import { calculateSpeedBonus } from "../../../utils/SpeedBonus";

interface WordleGameProps {
  puzzle: WordlePuzzle;
  difficulty: Difficulty;
  challengeId: number | null;
}

export const WordleGame = ({
  puzzle,
  difficulty,
  challengeId,
}: WordleGameProps) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { refreshChallenges } = useChallenges();

  const [solution] = useState(puzzle.solution_word.toUpperCase());
  const [wordLength] = useState(solution.length);
  const MAX_GUESSES = 6;

  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [currentRow, setCurrentRow] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [letterStatuses, setLetterStatuses] = useState<
    Record<string, KeyStatus>
  >({});
  const [gameResult, setGameResult] = useState<{
    score: number;
    submissionId: number | null;
  } | null>(null);

  // const [showResumeModal, setShowResumeModal] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState<{
    hasSubmitted: boolean;
    score?: number;
    submittedAt?: string;
    submissionId?: number;
  } | null>(null);
  const [checkingSubmission, setCheckingSubmission] = useState(true);

  const { time, startTimer, stopTimer, setSavedTime } = useTimer();

  const guessesRef = useRef<string[]>([]);
  useEffect(() => {
    guessesRef.current = guesses;
  }, [guesses]);

  const playLetter = useSound([click1, click2, click3], 0.4);
  const playBackspace = useSound([back], 0.4);
  const playSuccess = useSound([success], 0.4);
  const playError = useSound([error], 0.4);

  // Fetch game limits/config (for speed bonus calculation)
  const fetchLimits = useCallback(() => getGameLimits("wordle"), []);

  // FIX: Explicitly specify the type GameLimits for the fetched data
  // const { data: gameConfig, loading: configLoading } = useApi(fetchLimits);
  const { data: gameConfig } = useApi(fetchLimits);

  // Check for existing submission FIRST
  useEffect(() => {
    if (!puzzle?.date_to_be_used || !puzzle?.id) {
      setCheckingSubmission(false);
      return;
    }

    setCheckingSubmission(true);

    checkSubmissionExists("wordle", puzzle.date_to_be_used, puzzle.id)
      .then(async (result) => {
        if (result.hasSubmitted) {
          setAlreadyCompleted(result);
          setIsGameOver(true);

          if (challengeId && result.submissionId) {
            try {
              await new Promise((resolve) => setTimeout(resolve, 2000));

              await refreshChallenges();
            } catch (error) {
              console.error(
                "[WordleGame] ❌ Failed to auto-complete challenge:",
                error
              );
            }
          } else {
            console.log("[WordleGame] ❌ NOT completing challenge because:");
            if (!challengeId)
              console.log("[WordleGame]   - challengeId is missing/falsy");
            if (!result.submissionId)
              console.log(
                "[WordleGame]   - result.submissionId is missing/falsy"
              );
          }
        }
      })
      .catch((err) => console.error("[WordleGame] Check failed:", err))
      .finally(() => setCheckingSubmission(false));
  }, [puzzle?.date_to_be_used, puzzle?.id, challengeId, refreshChallenges]);

  // Fetch saved game
  const fetchSavedWordle = useCallback(() => {
    if (
      !puzzle?.date_to_be_used ||
      !puzzle?.id ||
      alreadyCompleted?.hasSubmitted
    ) {
      return Promise.resolve(null);
    }
    return getSavedAttempt(
      "wordle",
      puzzle.date_to_be_used,
      puzzle.id.toString()
    );
  }, [puzzle?.date_to_be_used, puzzle?.id, alreadyCompleted]);

  const { data: savedGame, loading } = useApi(fetchSavedWordle);

  // Load saved progress and START timer
  useEffect(() => {
    // 1. Guard clause: Stop if already submitted or if data is still loading
    if (alreadyCompleted?.hasSubmitted || loading) return;

    let loadedIsGameOver = false;

    if (savedGame && savedGame.puzzle_type === "wordle") {
      const progress = savedGame.progress_data as WordleProgress; // Restore game state
      setGuesses(progress.guesses || []);
      setCurrentRow(progress.currentRow || 0);
      setLetterStatuses(progress.letterStatuses || {});
      setIsGameOver(progress.isGameOver || false);
      loadedIsGameOver = progress.isGameOver; // 2. Load the saved time and initialize the timer

      setSavedTime(savedGame.time_spent_ms);
    } // 3. Critical Fix: Start the timer ONLY if the game is NOT over.
    // This ensures the timer resumes from saved time (if savedGame existed)
    // or starts from 0 (if savedGame was null/new game).

    if (!loadedIsGameOver) {
      startTimer();
    } // 4. Cleanup: Stop the timer when the component unmounts

    return () => {
      if (!loadedIsGameOver) {
        stopTimer();
      }
    };
  }, [
    savedGame,
    loading, // Added loading dependency
    startTimer,
    stopTimer, // Added stopTimer for cleanup
    setSavedTime,
    alreadyCompleted,
  ]);

  // Auto-save progress
  useEffect(() => {
    if (
      loading ||
      isGameOver ||
      alreadyCompleted?.hasSubmitted ||
      !puzzle?.date_to_be_used ||
      !puzzle?.id ||
      !difficulty
    )
      return;

    const saveTimer = setTimeout(() => {
      const progress: WordleProgress = {
        guesses,
        currentRow,
        letterStatuses,
        isGameOver,
        status: isGameOver ? "SOLVED" : "ACTIVE",
      };

      const dataPayload: PuzzleAttemptData = {
        puzzle_id: puzzle.id,
        puzzle_type: "wordle",
        progress_data: progress,
        time_spent_ms: time,
        difficulty: difficulty,
      };

      saveProgress(dataPayload, puzzle.date_to_be_used, puzzle.id).catch(
        (err) => console.error("[WordleGame] Save failed:", err)
      );
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [
    guesses,
    currentRow,
    isGameOver,
    time,
    loading,
    puzzle?.id,
    puzzle?.date_to_be_used,
    difficulty,
    letterStatuses,
    alreadyCompleted,
  ]);

  // endGame function
  const endGame = useCallback(
    async (
      tries: number,
      won: boolean,
      currentGuessesArray: string[],
      currentLetterStatuses: Record<string, KeyStatus>
    ) => {
      if (isGameOver || alreadyCompleted?.hasSubmitted) return;
      playSuccess();
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
      });

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
      let calculatedScore = 0;

      if (won && gameConfig) {
        const difficultyKey = difficulty.toUpperCase();

        // 1. Retrieve required constants
        const maxTimeMs = gameConfig.TIME_LIMITS_MS[difficultyKey] || 0;
        const basePoints = gameConfig.BASE_POINTS[difficultyKey] || 0;

        // Assuming MAX_TRIES is 6 (or fetched from config.GUESS_LIMITS if available)
        const MAX_TRIES = 6;
        const DEDUCTION_PER_TRY = 20;

        // 2. Calculate Tries Component
        const MAX_TRIES_BONUS = MAX_TRIES * DEDUCTION_PER_TRY; // e.g., 120
        const totalDeductionFromTries = tries * DEDUCTION_PER_TRY; // e.g., 4 * 20 = 80

        // Score based on tries: Start with Base + MaxTriesBonus, then subtract used tries
        const scoreAfterTriesDeduction = Math.max(
          0,
          basePoints + MAX_TRIES_BONUS - totalDeductionFromTries
        );

        // 3. Add Speed Component
        const actualSpeedBonus = calculateSpeedBonus(finalTime, maxTimeMs);

        calculatedScore = scoreAfterTriesDeduction + actualSpeedBonus;

        console.log(
          `[WordleGame] Base Pts: ${basePoints}, Tries Penalty: ${totalDeductionFromTries}, Speed Bonus: ${actualSpeedBonus}, Total Calculated: ${calculatedScore}`
        );
      } else {
        calculatedScore = 0; // If lost, score is 0
      }
      // --- 🚀 NEW SPEED BONUS CALCULATION END 🚀 ---
      try {
        const finalProgress: WordleProgress = {
          guesses: currentGuessesArray,
          currentRow: tries,
          letterStatuses: currentLetterStatuses,
          isGameOver: true,
          status: won ? "SOLVED" : "LOST",
        };

        await saveProgress(
          {
            puzzle_id: puzzle.id,
            puzzle_type: "wordle",
            progress_data: finalProgress,
            time_spent_ms: finalTime,
            difficulty: difficulty,
          },
          puzzle.date_to_be_used,
          puzzle.id
        );

        await new Promise((resolve) => setTimeout(resolve, 500));

        const submissionData: SubmissionData = {
          puzzle_id: puzzle.id,
          puzzle_type: "wordle",
          difficulty: difficulty,
          time_taken_ms: finalTime,
          tries: tries,
          status: won ? "SOLVED" : "LOST",
        };

        const submissionResult = await submitPuzzle(
          submissionData,
          puzzle.date_to_be_used,
          puzzle.id
        );

        finalScore = submissionResult.score;
        submissionIdForResultModal = submissionResult.submissionId ?? null;

        if (challengeId && submissionIdForResultModal) {
          try {
            await new Promise((resolve) => setTimeout(resolve, 3000));
          } catch (challengeError) {
            console.error("[WordleGame] ❌ Challenge error:", challengeError);
            await refreshChallenges();
          }
        } else {
          console.log("[WordleGame] ❌ NOT completing challenge because:");
          if (!challengeId)
            console.log("[WordleGame]   - challengeId is missing/falsy");
          if (!submissionIdForResultModal)
            console.log(
              "[WordleGame]   - submissionIdForResultModal is missing/falsy"
            );
        }
      } catch (err) {
        console.error("[WordleGame] Error:", err);
      } finally {
        setGameResult({
          score: finalScore,
          submissionId: submissionIdForResultModal,
        });
      }
    },
    [
      isGameOver,
      stopTimer,
      time,
      puzzle,
      difficulty,
      challengeId,
      alreadyCompleted,
      refreshChallenges,
      gameConfig, // Used to lookup limits/points
      calculateSpeedBonus, // Used to calculate bonus
      setGameResult, // Used in the final/error path
      saveProgress, // Used to save final progress
      submitPuzzle,
    ]
  );

  // handleKeyPress function
  const handleKeyPress = useCallback(
    async (key: string) => {
      if (isGameOver || alreadyCompleted?.hasSubmitted) return;

      if (key === "Enter" && currentGuess.length === wordLength) {
        playLetter();
        // FRONTEND VALIDATION
        const valid = await isValidWord(currentGuess);
        if (!valid) {
          playError();
          setErrorMessage(`'${currentGuess}' is not a valid word.`);
          return; // stop here
        }

        // Proceed to add guess and save progress
        if (!puzzle?.date_to_be_used || !puzzle?.id || !difficulty) return;

        const newGuesses = [...guesses, currentGuess];
        const newRow = currentRow + 1;

        const newStatuses = { ...letterStatuses };
        currentGuess.split("").forEach((char, i) => {
          if (solution[i] === char) newStatuses[char] = "correct";
          else if (solution.includes(char) && newStatuses[char] !== "correct")
            newStatuses[char] = "present";
          else newStatuses[char] = "absent";
        });

        setGuesses(newGuesses);
        setCurrentRow(newRow);
        setLetterStatuses(newStatuses);
        setCurrentGuess("");
        setErrorMessage(null); // Clear previous errors

        // Save progress AFTER validation
        const progress: WordleProgress = {
          guesses: newGuesses,
          currentRow: newRow,
          letterStatuses: newStatuses,
          isGameOver: newRow >= MAX_GUESSES || currentGuess === solution,
          status: newGuesses.includes(solution) ? "SOLVED" : "ACTIVE",
        };

        const dataPayload: PuzzleAttemptData = {
          puzzle_id: puzzle.id,
          puzzle_type: "wordle",
          progress_data: progress,
          time_spent_ms: time,
          difficulty,
        };

        saveProgress(dataPayload, puzzle.date_to_be_used, puzzle.id).catch(
          (err) => console.error("[WordleGame] Save failed:", err)
        );

        // Check for game end
        if (currentGuess === solution) {
          setTimeout(() => endGame(newRow, true, newGuesses, newStatuses), 100);
        } else if (newRow >= MAX_GUESSES) {
          setTimeout(
            () => endGame(MAX_GUESSES, false, newGuesses, newStatuses),
            100
          );
        }
      } else if (key === "Backspace") {
        playBackspace();
        setCurrentGuess((g) => g.slice(0, -1));
      } else if (currentGuess.length < wordLength && /^[a-zA-Z]$/.test(key)) {
        playLetter();
        setCurrentGuess((g) => g + key.toUpperCase());
      }
    },
    [
      isGameOver,
      currentGuess,
      guesses,
      currentRow,
      letterStatuses,
      solution,
      wordLength,
      endGame,
      MAX_GUESSES,
      alreadyCompleted,
      puzzle,
      difficulty,
      time,
    ]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Backspace") {
        handleKeyPress(e.key);
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress]);

  // const handleContinue = () => {
  //   setShowResumeModal(false);
  //   startTimer();
  // };

  const difficultyKey = difficulty.toUpperCase();
  const basePoints = gameConfig?.BASE_POINTS?.[difficultyKey] || 0;
  const maxTimeMs = gameConfig?.TIME_LIMITS_MS?.[difficultyKey] || 1;

  // 1. Calculate Speed Bonus
  const currentSpeedBonus = calculateSpeedBonus(time, maxTimeMs);

  // 2. Calculate Tries Bonus 
  // "Perfect Game" (1 Try) = 120 - 20 = 100 points from tries.
  // We use this 100 as our 'Full Bar' baseline for the tries component.
  const REAL_MAX_TRIES_BONUS = 100;
  const DEDUCTION_PER_EXTRA_TRY = 20;

  // currentRow starts at 0. 
  // Row 0 (Try #1) -> Penalty 0
  // Row 2 (Try #3) -> Penalty 40
  const currentTriesPenalty = currentRow * DEDUCTION_PER_EXTRA_TRY;

  // 3. Calculate Totals
  // Max Possible = Base + Max Speed (100) + Perfect Tries (100)
  const maxPossibleScore = basePoints + 100 + REAL_MAX_TRIES_BONUS;

  // Current Potential = Base + Speed + (Perfect Tries - Penalty)
  const triesScoreComponent = Math.max(0, basePoints + REAL_MAX_TRIES_BONUS - currentTriesPenalty);
  const currentPotentialScore = triesScoreComponent + currentSpeedBonus;

  // 4. Calculate Bar Percentage
  const progressPercentage = maxPossibleScore > 0
    ? (currentPotentialScore / maxPossibleScore) * 100
    : 0;

  const getBarColor = () => {
    if (progressPercentage > 66) return "bg-green-500";
    if (progressPercentage > 33) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (checkingSubmission || loading) {
    return <LoadingSpinner fullPage={true} />;
  }

  if (alreadyCompleted?.hasSubmitted) {
    return (
      <AlreadyPlayedScreen
        gameType="wordle"
        score={alreadyCompleted.score || 0}
        submittedAt={alreadyCompleted.submittedAt || new Date().toISOString()}
        difficulty={difficulty}
      />
    );
  }

  return (
    <>
      {/* {showResumeModal && (
        <ResumeGameModal
          guessCount={guesses.length}
          maxGuesses={MAX_GUESSES}
          puzzleDate={puzzle.date_to_be_used}
          puzzleNumber={puzzle.id}
          editor="ERNI Team"
          onContinue={handleContinue}
        />
      )} */}

      <div className="grid grid-cols-1 lg:grid-cols-2 items-center p-4">
        <div className="place-content-center p-20 text-xl leading-6 bg-white h-full rounded-3xl">
          <WordleGrid
            guesses={guesses}
            currentGuess={currentGuess}
            solution={solution}
            currentRow={currentRow}
            maxGuesses={MAX_GUESSES}
            wordLength={wordLength}
          />
          {errorMessage && (
            <div className="text-red-600 font-bold mt-2">{errorMessage}</div>
          )}
        </div>

        <div className="place-content-center p-20 text-xl leading-5">
          <div className="flex justify-between mb-10">
            <div>
              <h1 className="text-4xl font-bold">Wordle</h1>
              <p>on {difficulty} difficulty</p>
            </div>
            <Timer timeMs={time} />
          </div>

          <div className="mb-6 w-full">
            <div className="flex justify-between text-sm font-bold text-gray-700 mb-1">
              <span>Potential Score</span>
              <span>{currentPotentialScore} / {maxPossibleScore} pts</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner overflow-hidden">
              <div
                className={`${getBarColor()} h-4 rounded-full transition-all duration-700 ease-in-out relative`}
                style={{ width: `${progressPercentage}%` }}
              >
                {/* <div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-b from-white/20 to-transparent"></div> */}
              </div>
            </div>

            <div className="flex justify-between text-xs mt-1 text-gray-500 font-medium">
              <span>Base: {basePoints}</span>
              <span className="text-blue-600">Speed: +{currentSpeedBonus}</span>
              {/* Only show penalty text if there is actually a penalty (> 0) */}
              <span className={`${currentTriesPenalty > 0 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                Attempts Penalty: -{currentTriesPenalty}
              </span>
            </div>
          </div>

          <div className={isGameOver ? "opacity-50 pointer-events-none" : ""}>
            <Keyboard
              onKeyPress={handleKeyPress}
              letterStatuses={letterStatuses}
            />
          </div>

          {gameResult && (
            <PostGameResultsModal
              score={gameResult.score}
              submissionId={gameResult.submissionId}
              gameType="wordle"
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
