// src/components/gameComponents/ernigram/ernigramGame.tsx
import { useState, useEffect, useCallback } from "react";
import {
  submitPuzzle,
  getSavedAttempt,
  saveProgress,
  checkSubmissionExists,
  getGameLimits,
} from "../../../api/gameService";
import { completeChallenge } from "../../../api/challengeService";
import { useChallenges } from "../../../context/ChallengeContext";
import type {
  ErnigramPuzzle,
  SubmissionData,
  PuzzleAttemptData,
  ErnigramProgress,
  KeyStatus,
  SubmissionResult,
} from "../../../types/game";
import { PhraseDisplay } from "./phraseDisplay";
import { AttemptsTracker } from "./attemptsTracker";
import { Keyboard } from "../wordle/keyboard";
import { PostGameResultsModal } from "../../ui/postGameResultsModal";
import { AlreadyPlayedScreen } from "../shared/alreadyPlayedScreen";
import { useTimer } from "../../../hooks/useTimer";
import { Timer } from "../../ui/timer";
import { useApi } from "../../../hooks/useApi";
import { LoadingSpinner } from "../../ui/loadingSpinner";
import type { Difficulty } from "../../../pages/gamePage";
import { API_URL } from "../../../api/authService";
import { useAuth } from "@/hooks/authContext";
import clsx from "clsx";

import click1 from "@/assets/sounds/keyboard_press_1.mp3";
import click2 from "@/assets/sounds/keyboard_press_2.mp3";
import click3 from "@/assets/sounds/keyboard_press_3.mp3";
import success from "@/assets/sounds/success.mp3";
import error from "@/assets/sounds/error.mp3";

import { useSound } from "../../../hooks/useSound";
import { calculateSpeedBonus } from "../../../utils/SpeedBonus";
import { PotentialScoreBar } from "../../ui/potentialScoreBar"; // <--- IMPORTED

interface ErnigramGameProps {
  puzzle: ErnigramPuzzle;
  difficulty: Difficulty;
  challengeId: number | null;
  dailyPuzzleDate: string;
  children?: React.ReactNode;
}

const MAX_ATTEMPTS = (difficulty: Difficulty) =>
  difficulty === "hard" ? 3 : 6;

export const ErnigramGame = ({
  puzzle,
  difficulty,
  challengeId,
  dailyPuzzleDate,
  children,
}: ErnigramGameProps) => {
  const { refreshUser } = useAuth();
  const { refreshChallenges } = useChallenges();
  const [solution] = useState(puzzle.solution_phrase.toUpperCase());
  const maxAttemptsForDifficulty = MAX_ATTEMPTS(difficulty);

  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [attemptsLeft, setAttemptsLeft] = useState(() =>
    MAX_ATTEMPTS(difficulty)
  );
  const [isGameOver, setIsGameOver] = useState(false);
  const [letterStatuses, setLetterStatuses] = useState<
    Record<string, KeyStatus>
  >({});
  const [gameResult, setGameResult] = useState<{
    score: number;
    submissionId: number | null;
    currentStreak: number;
    maxStreak: number;
    streakUpdatedToday: boolean;
    message: string;
  } | null>(null);

  const [alreadyCompleted, setAlreadyCompleted] = useState<{
    hasSubmitted: boolean;
    score?: number;
    submittedAt?: string;
    submissionId?: number;
    difficulty?: string;
  } | null>(null);
  const [checkingSubmission, setCheckingSubmission] = useState(true);

  const { time, startTimer, stopTimer, setSavedTime } = useTimer();

  const playLetter = useSound([click1, click2, click3], 0.4);
  const playError = useSound([error], 0.4);
  const playSuccess = useSound([success], 0.4);

  const puzzleID = puzzle.id;
  const [isWon, setIsWon] = useState(false);

  const fetchLimits = useCallback(() => getGameLimits("ernigram"), []);
  const { data: gameConfig, loading: configLoading } = useApi(fetchLimits);

  // ✅ 1. Check for existing submission FIRST
  useEffect(() => {
    if (!dailyPuzzleDate || !puzzleID) {
      setCheckingSubmission(false);
      return;
    }

    setCheckingSubmission(true);

    checkSubmissionExists("ernigram", dailyPuzzleDate, puzzleID)
      .then(async (result) => {
        if (result.hasSubmitted) {
          setAlreadyCompleted(result);
          setIsGameOver(true);

          if (challengeId && result.submissionId) {
            try {
              await completeChallenge(challengeId, {
                submission_id: result.submissionId,
              });

              await new Promise((resolve) => setTimeout(resolve, 2000));
              await refreshChallenges();
            } catch (error) {
              console.error(
                "[ErnigramGame] ❌ Failed to auto-complete challenge:",
                error
              );
            }
          }
        }
      })
      .catch((err) => console.error("[ErnigramGame] Check failed:", err))
      .finally(() => setCheckingSubmission(false));
  }, [dailyPuzzleDate, puzzleID, challengeId, refreshChallenges]);

  // ✅ 2. Fetch saved game
  const fetchSavedErnigram = useCallback(() => {
    if (
      !dailyPuzzleDate ||
      !puzzleID ||
      checkingSubmission ||
      alreadyCompleted?.hasSubmitted
    ) {
      return Promise.resolve(null);
    }
    return getSavedAttempt("ernigram", dailyPuzzleDate, puzzleID.toString());
  }, [dailyPuzzleDate, puzzleID, checkingSubmission, alreadyCompleted]);

  const { data: savedGame, loading } = useApi(fetchSavedErnigram);

  // Effect 1: Set saved time when game loads
  useEffect(() => {
    if (savedGame?.time_spent_ms && savedGame.time_spent_ms > 0) {
      setSavedTime(savedGame.time_spent_ms);
    }
  }, [savedGame?.time_spent_ms, setSavedTime]);

  // Effect 2: Load game state and start timer
  useEffect(() => {
    if (alreadyCompleted?.hasSubmitted || checkingSubmission || loading) return;

    let loadedIsGameOver = false;

    if (savedGame && savedGame.puzzle_type === "ernigram") {
      const progress = savedGame.progress_data as ErnigramProgress;

      setGuessedLetters(progress.guessedLetters);
      const incorrectGuesses = progress.guessedLetters.filter(
        (g) => !solution.includes(g)
      ).length;
      const currentMax = MAX_ATTEMPTS(difficulty);
      setAttemptsLeft(Math.max(0, currentMax - incorrectGuesses));
      setIsGameOver(progress.isGameOver);

      loadedIsGameOver = progress.isGameOver;

      const newStatuses: Record<string, KeyStatus> = {};
      progress.guessedLetters.forEach((char) => {
        if (solution.includes(char)) newStatuses[char] = "correct";
        else newStatuses[char] = "absent";
      });
      setLetterStatuses(newStatuses);

      if (loadedIsGameOver) {
        const uniqueLetters = [...new Set(solution.replace(/ /g, ""))];
        const hasWon = uniqueLetters.every((char) =>
          progress.guessedLetters.includes(char)
        );
        if (hasWon) {
          setIsWon(true);
        }
        setGameResult({
          score: 0,
          submissionId: null,
          currentStreak: 0,
          maxStreak: 0,
          streakUpdatedToday: false,
          message: hasWon
            ? "You already completed this puzzle!"
            : "You already attempted this puzzle.",
        });
        return;
      }
    }

    if (!loadedIsGameOver) {
      startTimer();
    }

    return () => {
      if (!loadedIsGameOver) {
        stopTimer();
      }
    };
  }, [
    savedGame,
    startTimer,
    stopTimer,
    solution,
    difficulty,
    alreadyCompleted,
    checkingSubmission,
    loading,
  ]);

  // ✅ 4. Auto-save progress
  useEffect(() => {
    if (
      loading ||
      isGameOver ||
      alreadyCompleted?.hasSubmitted ||
      !dailyPuzzleDate ||
      !puzzle.id ||
      !difficulty
    )
      return;

    const saveTimer = setTimeout(() => {
      const progress: ErnigramProgress = {
        guessedLetters,
        attemptsLeft,
        isGameOver,
      };

      const dataPayload: PuzzleAttemptData = {
        puzzle_id: puzzle.id,
        puzzle_type: "ernigram",
        progress_data: progress,
        time_spent_ms: time,
        difficulty: difficulty,
      };

      saveProgress(dataPayload, dailyPuzzleDate, puzzle.id).catch((err) =>
        console.error("[ErnigramGame] ❌ Auto-save failed:", err)
      );
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [
    guessedLetters,
    attemptsLeft,
    isGameOver,
    time,
    loading,
    puzzle.id,
    dailyPuzzleDate,
    difficulty,
    alreadyCompleted,
  ]);

  // ✅ 5. endGame function with challenge support
  const endGame = useCallback(
    async (won: boolean) => {
      setIsGameOver(true);
      if (won) {
        setIsWon(true);
      }
      stopTimer();
      const finalTime = time;

      let submissionIdForResultModal: number | null = null;
      const triesTaken = maxAttemptsForDifficulty - attemptsLeft;
      let submissionResult: SubmissionResult | null = null;

      let finalScore = 0;

      if (won && gameConfig) {
        const difficultyKey = difficulty.toUpperCase();
        const maxTimeMs = gameConfig.TIME_LIMITS_MS?.[difficultyKey] || 0;
        const basePoints = gameConfig.BASE_POINTS?.[difficultyKey] || 0;
        const maxMistakes = gameConfig.MISTAKE_LIMITS?.[difficultyKey] || 0;

        const misses = guessedLetters.filter(
          (letter) => !solution.includes(letter)
        ).length;

        // --- SCORING LOGIC DUPLICATED HERE FOR SUBMISSION ---
        const MISTAKE_DEDUCTION_PER_MISTAKE = 20;
        const maxMistakeBonus = maxMistakes * MISTAKE_DEDUCTION_PER_MISTAKE;
        const scorePool = basePoints + maxMistakeBonus;
        const deduction = misses * MISTAKE_DEDUCTION_PER_MISTAKE;
        const basePointsAfterPenalty = Math.max(0, scorePool - deduction);
        const speedBonus = calculateSpeedBonus(finalTime, maxTimeMs);

        finalScore = basePointsAfterPenalty + speedBonus;
      } else if (!won) {
        finalScore = 0;
      }

      if (!dailyPuzzleDate || !puzzle.id) {
        setGameResult({
          score: 0,
          submissionId: null,
          currentStreak: 0,
          maxStreak: 0,
          streakUpdatedToday: false,
          message: "",
        });
        return;
      }

      try {
        const misses = guessedLetters.filter(
          (letter) => !solution.includes(letter)
        ).length;

        const finalProgressData = {
          guessedLetters,
          attemptsLeft: won ? attemptsLeft : 0,
          isGameOver: true,
          misses: misses,
          tries: triesTaken,
          status: won ? "SOLVED" : "LOST",
        };

        await saveProgress(
          {
            puzzle_id: puzzle.id,
            puzzle_type: "ernigram",
            progress_data: finalProgressData,
            time_spent_ms: finalTime,
            difficulty: difficulty,
          },
          dailyPuzzleDate,
          puzzle.id
        );

        const submissionData: SubmissionData = {
          puzzle_id: puzzle.id,
          puzzle_type: "ernigram",
          difficulty: difficulty,
          time_taken_ms: finalTime,
          tries: triesTaken,
          status: won ? "SOLVED" : "LOST",
        };

        submissionResult = await submitPuzzle(
          submissionData,
          dailyPuzzleDate,
          puzzle.id
        );

        if (submissionResult) {
            console.log("Refetching user points...");
            await refreshUser(); 
        }

        finalScore = submissionResult.score; // Trust backend score
        submissionIdForResultModal = submissionResult.submissionId ?? null;

        if (challengeId && submissionIdForResultModal) {
          try {
            await completeChallenge(challengeId, {
              submission_id: submissionIdForResultModal,
            });
            await new Promise((resolve) => setTimeout(resolve, 3000));
            await refreshChallenges();
          } catch (challengeError) {
            console.error("[ErnigramGame] ❌ Challenge error:", challengeError);
            await refreshChallenges();
          }
        }
      } catch (err) {
        console.error("[ErnigramGame] ❌ Error during end:", err);
      } finally {
        setGameResult({
          score: finalScore,
          submissionId: submissionIdForResultModal,
          currentStreak: submissionResult?.currentStreak ?? 0,
          maxStreak: submissionResult?.maxStreak ?? 0,
          streakUpdatedToday: submissionResult?.streakUpdatedToday ?? false,
          message: won
            ? (submissionResult?.message ?? "Puzzle completed!")
            : (submissionResult?.message ?? "Better luck next time!"),
        });
      }
    },
    [
      stopTimer,
      time,
      maxAttemptsForDifficulty,
      attemptsLeft,
      puzzle.id,
      difficulty,
      challengeId,
      dailyPuzzleDate,
      guessedLetters,
      solution,
      refreshChallenges,
      gameConfig,
      calculateSpeedBonus,
      setIsWon,
      setGameResult,
      saveProgress,
      submitPuzzle,
    ]
  );

  const checkGameState = useCallback(
    (currentGuesses: string[], currentAttempts: number) => {
      const uniqueLetters = [...new Set(solution.replace(/ /g, ""))];
      const hasWon = uniqueLetters.every((char) =>
        currentGuesses.includes(char)
      );

      if (hasWon) {
        playSuccess();
        endGame(true);
      } else if (currentAttempts <= 0) {
        endGame(false);
      }
    },
    [solution, endGame, playSuccess]
  );

  const saveImmediately = useCallback(
    (newGuessedLetters: string[], newAttemptsLeft: number) => {
      if (
        !dailyPuzzleDate ||
        !puzzle.id ||
        isGameOver ||
        alreadyCompleted?.hasSubmitted
      )
        return;

      const progress: ErnigramProgress = {
        guessedLetters: newGuessedLetters,
        attemptsLeft: newAttemptsLeft,
        isGameOver: false,
      };

      const dataPayload: PuzzleAttemptData = {
        puzzle_id: puzzle.id,
        puzzle_type: "ernigram",
        progress_data: progress,
        time_spent_ms: time,
        difficulty: difficulty,
      };

      saveProgress(dataPayload, dailyPuzzleDate, puzzle.id).catch((err) =>
        console.error("[ErnigramGame] ❌ Immediate save failed:", err)
      );
    },
    [dailyPuzzleDate, puzzle.id, time, difficulty, isGameOver, alreadyCompleted]
  );

  const handleKeyPress = useCallback(
    (key: string) => {
      if (isGameOver || key.length > 1) return;

      const char = key.toUpperCase();
      if (guessedLetters.includes(char) || !/^[A-Z]$/.test(char)) return;

      const newGuessedLetters = [...guessedLetters, char];
      setGuessedLetters(newGuessedLetters);

      let newAttemptsLeft = attemptsLeft;
      const newStatuses = { ...letterStatuses };

      if (solution.includes(char)) {
        newStatuses[char] = "correct";
        playLetter();
      } else {
        newStatuses[char] = "absent";
        newAttemptsLeft = attemptsLeft - 1;
        setAttemptsLeft(newAttemptsLeft);
        playError();
      }
      setLetterStatuses(newStatuses);

      const uniqueLetters = [...new Set(solution.replace(/ /g, ""))];
      const hasWon = uniqueLetters.every((char) =>
        newGuessedLetters.includes(char)
      );
      const isLost = newAttemptsLeft <= 0;
      const isGameEndingMove = hasWon || isLost;

      if (!isGameEndingMove) {
        saveImmediately(newGuessedLetters, newAttemptsLeft);
      }

      checkGameState(newGuessedLetters, newAttemptsLeft);
    },
    [
      isGameOver,
      guessedLetters,
      solution,
      attemptsLeft,
      letterStatuses,
      checkGameState,
      saveImmediately,
      playLetter,
      playError,
    ]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress]);

  // --- 🚀 LIVE SCORE BAR CALCULATION START 🚀 ---
  const difficultyKey = difficulty.toUpperCase();
  const configBasePoints = gameConfig?.BASE_POINTS?.[difficultyKey] || 0;
  const configMaxMistakes = gameConfig?.MISTAKE_LIMITS?.[difficultyKey] || 0;
  const configMaxTimeMs = gameConfig?.TIME_LIMITS_MS?.[difficultyKey] || 1;

  const MISTAKE_DEDUCTION = 20;
  const MAX_SPEED_BONUS = 100; // Assuming standard 100 bonus

  // 1. Calculate Mistakes
  const currentMisses = guessedLetters.filter(
    (letter) => !solution.includes(letter)
  ).length;

  console.log(configBasePoints, configMaxMistakes, configMaxTimeMs);
  const currentSpeedBonus = calculateSpeedBonus(time, configMaxTimeMs);
  // Calculate Bonus Pool
  const maxMistakeBonusPool = configMaxMistakes * MISTAKE_DEDUCTION;
  const currentDeduction = currentMisses * MISTAKE_DEDUCTION;

  // Calculate Remaining Bonus
  const currentMistakeBonus = Math.max(
    0,
    maxMistakeBonusPool - currentDeduction
  );

  // Max Score includes the full bonus pool
  const maxPossibleScore =
    configBasePoints + maxMistakeBonusPool + MAX_SPEED_BONUS;

  // Current score uses the remaining bonus
  const currentPotentialScore =
    configBasePoints + currentMistakeBonus + currentSpeedBonus;
  // --- 🚀 LIVE SCORE BAR CALCULATION END 🚀 ---

  if (
    loading ||
    configLoading ||
    !puzzle ||
    !dailyPuzzleDate ||
    checkingSubmission
  ) {
    return <LoadingSpinner fullPage={true} />;
  }

  if (alreadyCompleted?.hasSubmitted) {
    return (
      <AlreadyPlayedScreen
        gameType="ernigram"
        score={alreadyCompleted.score || 0}
        submittedAt={alreadyCompleted.submittedAt || new Date().toISOString()}
        difficulty={(alreadyCompleted.difficulty as Difficulty) || difficulty}
      />
    );
  }

  const fullImageUrl = puzzle.employee_image_url
    ? API_URL.replace(/\/$/, "") + puzzle.employee_image_url
    : "";

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 items-center md:p-4">
        <div className="place-content-center px-2 text-lg md:text-xl leading-6 bg-white h-full rounded-3xl order-3 lg:order-1">
          <div className="place-content-center px-4 pt-4 md:p-20 text-xl leading-6 bg-white h-full rounded-3xl">
            {puzzle.employee_image_url != "None" ? (
              <div className="w-9/10 md:w-full md:max-w-md mx-auto px-4">
                <img
                  src={fullImageUrl}
                  alt="Employee to guess"
                  className={clsx(
                    "rounded-lg transition-all duration-700 ease-in-out",
                    !isWon ? "blur-md" : "blur-none"
                  )}
                />
                <p className="text-[13px] text-center font-bold md:text-xl text-black mt-3 md:mt-6 md:mb-6">
                  {"Guess the employee's name!"}
                </p>
              </div>
            ) : (
              <p className="text-sm md:text-xl text-black mb-6">
                {puzzle.clue}
              </p>
            )}

            <div className="flex justify-between w-full max-w-sm items-center md:mb-4">
              <AttemptsTracker attemptsLeft={attemptsLeft} />
            </div>

            <PhraseDisplay
              solutionPhrase={solution}
              guessedLetters={guessedLetters}
            />
          </div>
        </div>
        <div className="contents lg:flex lg:flex-col lg:place-content-center p-0 lg:p-20 text-xl leading-5 lg:order-2">
          <div className="flex justify-between lg:mb-6 order-1 lg:order-none mb-2 lg:p-0">
            <div className="">
              <h1 className="text-xl lg:text-4xl font-bold">ERNIgram</h1>
              <p className="text-sm lg:text-base">on {difficulty} difficulty</p>
            </div>

            <Timer timeMs={time} />
            {children}
          </div>

          {/* --- NEW POTENTIAL SCORE BAR --- */}
          <div className="order-2 lg:order-none px-10 md:px-0  lg:p-0">
            <PotentialScoreBar
              currentScore={currentPotentialScore}
              maxScore={maxPossibleScore}
              basePoints={configBasePoints} // Display Base as "Base + Potential Mistake Bonus" or just Base depending on preference. Passing total pool usually looks better.
              speedBonus={currentSpeedBonus}
              bonusOrPenaltyValue={currentMistakeBonus}
              bonusOrPenaltyLabel="Mistake Bonus"
              color="bg-blue-500"
            />
          </div>
          {/* ------------------------------- */}

          <div
            className={
              isGameOver
                ? "order-4 lg:order-none mt-5 lg:mt-0 opacity-50 pointer-events-none"
                : "order-4 lg:order-none mt-5 lg:mt-0"
            }
          >
            <Keyboard
              onKeyPress={handleKeyPress}
              letterStatuses={letterStatuses}
            />
          </div>

          {gameResult && (
            <PostGameResultsModal
              score={gameResult.score}
              submissionId={gameResult.submissionId}
              gameType="ernigram"
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

