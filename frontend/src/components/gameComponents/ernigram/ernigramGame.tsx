import React, { useState, useEffect, useCallback } from "react";
import {
  submitPuzzle,
  getSavedAttempt,
  saveProgress,
} from "../../../api/gameService"; // Adjust path
import { completeChallenge } from "../../../api/challengeService";
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
import { useTimer } from "../../../hooks/useTimer";
import { Timer } from "../../ui/timer";
import { useApi } from "../../../hooks/useApi";
import { LoadingSpinner } from "../../ui/loadingSpinner";
import type { Difficulty } from "../../../pages/gamePage"; // Adjust path
import { API_URL } from "../../../api/authService"; // <-- 1. Import your backend URL
import clsx from "clsx"; // <-- 2. Import clsx for conditional classes

interface ErnigramGameProps {
  puzzle: ErnigramPuzzle;
  difficulty: Difficulty;
  challengeId: number | null;
  dailyPuzzleDate: string;
}

const MAX_ATTEMPTS = (difficulty: Difficulty) =>
  difficulty === "hard" ? 3 : 6;

export const ErnigramGame = ({
  puzzle,
  difficulty,
  challengeId,
  dailyPuzzleDate,
}: ErnigramGameProps) => {
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

  const { time, startTimer, stopTimer, setSavedTime } = useTimer();

  const puzzleID = puzzle.id;
  const fetchSavedErnigram = useCallback(() => {
    // VITAL: Guard clause to prevent call if IDs are null
    if (dailyPuzzleDate === null || puzzleID === null) {
      return Promise.resolve(null); // Return early or handle loading state
    }

    // VITAL FIX: Use .toString() to convert the number IDs to the required string type
    return getSavedAttempt(
      "ernigram",
      dailyPuzzleDate, // Converts number to string (e.g., 100 -> "100")
      puzzleID.toString() // puzzleID is number, but GSA expects string for the second parameter!
    );
  }, [dailyPuzzleDate, puzzleID]);

  const { data: savedGame, loading } = useApi(fetchSavedErnigram);

  const [isWon, setIsWon] = useState(false); //
  // Effect to load data
  useEffect(() => {
    let loadedIsGameOver = false;
    if (savedGame && savedGame.puzzle_type === "ernigram") {
      const progress = savedGame.progress_data as ErnigramProgress;
      setGuessedLetters(progress.guessedLetters);
      // Recalculate attemptsLeft based on saved guesses and current difficulty
      const incorrectGuesses = progress.guessedLetters.filter(
        (g) => !solution.includes(g)
      ).length;
      const currentMax = MAX_ATTEMPTS(difficulty); // Use current difficulty setting
      setAttemptsLeft(Math.max(0, currentMax - incorrectGuesses));
      setIsGameOver(progress.isGameOver);
      setSavedTime(savedGame.time_spent_ms);
      loadedIsGameOver = progress.isGameOver;

      const newStatuses: Record<string, KeyStatus> = {};
      progress.guessedLetters.forEach((char) => {
        if (solution.includes(char)) newStatuses[char] = "correct";
        else newStatuses[char] = "absent";
      });
      setLetterStatuses(newStatuses);
    }
    if (!loadedIsGameOver) {
      startTimer();
    }
  }, [savedGame, startTimer, setSavedTime, solution, difficulty]); // Added difficulty dependency

  // Effect to auto-save
  useEffect(() => {
    // 1. Check Guard Clauses: Ensure all necessary data is present before proceeding
    if (loading || isGameOver || !dailyPuzzleDate || !difficulty)
      return; // Use 'difficulty'

    const saveTimer = setTimeout(() => {
      const progress: ErnigramProgress = {
        guessedLetters,
        attemptsLeft,
        isGameOver,
      };

      const dataPayload = {
        puzzle_id: puzzle.id,
        puzzle_type: "ernigram" as const,
        progress_data: progress,
        time_spent_ms: time,
        // VITAL FIX: Use the destructured prop 'difficulty'
        difficulty: difficulty,
      };

      // VITAL FIX: Now saveProgress is correctly called with the destructured variables
      saveProgress(
        dataPayload,
        dailyPuzzleDate, // Available from props
        puzzle.id
      );
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [
    // VITAL: All dependencies must be correctly named props/state variables
    guessedLetters,
    attemptsLeft,
    isGameOver,
    time,
    loading,
    puzzle.id,
    dailyPuzzleDate, // Available from props
    difficulty, // Available from props
  ]);

  // endGame function
  const endGame = useCallback(
    async (won: boolean) => {
      // Check isGameOver *again* inside async function to prevent race conditions
      // We can't use isGameOver from state as a dependency easily, so read it from a ref or check here

      setIsGameOver(true); // Set game over state
      if (won) {
        setIsWon(true); // <-- This sets the state for the image
      }
      stopTimer();
      const finalTime = time;
      let finalScore = 0;
      let submissionIdForResultModal: number | null = null;
      const triesTaken = maxAttemptsForDifficulty - attemptsLeft;
      let submissionResult: SubmissionResult | null = null;

      try {
        if (won) {
          const submissionData: SubmissionData = {
            puzzle_id: puzzle.id,
            puzzle_type: "ernigram",
            difficulty: difficulty,
            time_taken_ms: finalTime,
            tries: triesTaken,
          };
          submissionResult = await submitPuzzle(
            submissionData,
            dailyPuzzleDate,
            puzzle.id
          );
          finalScore = submissionResult.score;
          submissionIdForResultModal = submissionResult.submissionId ?? null;

          if (challengeId && submissionIdForResultModal) {
            await completeChallenge(challengeId, {
              submission_id: submissionIdForResultModal,
            });
          }
        } else {
          finalScore = 0;
          submissionIdForResultModal = null;
        }
      } catch (err) {
        console.error("Error during Ernigram end:", err);
      } finally {
        setGameResult({
          score: finalScore,
          submissionId: submissionIdForResultModal,
          currentStreak: submissionResult?.currentStreak ?? 0,
          maxStreak: submissionResult?.maxStreak ?? 0,
          streakUpdatedToday: submissionResult?.streakUpdatedToday ?? false,
          message: submissionResult?.message ?? "",
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
    ]
  ); // Add all dependencies

  // checkGameState callback
  const checkGameState = useCallback(
    (currentGuesses: string[], currentAttempts: number) => {
      const uniqueLetters = [...new Set(solution.replace(/ /g, ""))];
      const hasWon = uniqueLetters.every((char) =>
        currentGuesses.includes(char)
      );

      if (hasWon) {
        endGame(true);
      } else if (currentAttempts <= 0) {
        endGame(false);
      }
    },
    [solution, endGame]
  ); // <-- Add endGame as a dependency

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
      } else {
        newStatuses[char] = "absent";
        newAttemptsLeft = attemptsLeft - 1;
        setAttemptsLeft(newAttemptsLeft);
      }
      setLetterStatuses(newStatuses);

      // Call the memoized function
      checkGameState(newGuessedLetters, newAttemptsLeft);
    },
    [
      isGameOver,
      guessedLetters,
      solution,
      attemptsLeft,
      letterStatuses,
      checkGameState,
    ]
  ); // <-- Add checkGameState

  // Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process single letters
      if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress]);

  // if (loading) {
  //   return <LoadingSpinner fullPage={true} />;
  // }

  console.log(isWon);

  const fullImageUrl = puzzle.employee_image_url
    ? API_URL.replace(/\/$/, "") + puzzle.employee_image_url
    : ""; // If the URL is null, return an empty string.
  console.log(fullImageUrl);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 items-center p-4">
      <div className="place-content-center p-20 text-xl leading-6 bg-white h-full rounded-3xl">
        <div className="place-content-center p-4 md:p-20 text-xl leading-6 bg-white h-full rounded-3xl">
          {puzzle.employee_image_url ? (
            <div className="w-full max-w-sm mx-auto">
              <img
                src={fullImageUrl}
                alt="Employee to guess"
                className={clsx(
                  "rounded-lg transition-all duration-700 ease-in-out",
                  !isWon ? "blur-md" : "blur-none" // Stays blurred unless you win
                )}
              />
              <p className="text-xl text-black mt-6 mb-6">
                {"Guess the employee's name!"}
              </p>
            </div>
          ) : (
            // Fallback if no image is uploaded
            <p className="text-xl text-black mb-6">{puzzle.clue}</p>
          )}
          {/* <p className="text-xl text-black mb-6">{puzzle.clue}</p> */}

          <div className="flex justify-between w-full max-w-sm items-center mb-4">
            <AttemptsTracker attemptsLeft={attemptsLeft} />
          </div>

          <PhraseDisplay
            solutionPhrase={solution}
            guessedLetters={guessedLetters}
          />
        </div>
      </div>
      <div className="place-content-center p-20 text-xl leading-5">
        <div className="flex justify-between mb-10">
          <div className="">
            <h1 className="text-4xl font-bold">ERNIgram</h1>
            <p>on {difficulty} difficulty</p>
          </div>
          <Timer timeMs={time} />
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
            currentStreak={gameResult.currentStreak}
            maxStreak={gameResult.maxStreak}
            streakUpdatedToday={gameResult.streakUpdatedToday}
            message={gameResult.message}
            onClose={() => setGameResult(null)}
          />
        )}
      </div>
    </div>
  );
};
