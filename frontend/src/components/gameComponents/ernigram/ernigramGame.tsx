// src/components/gameComponents/ernigram/ernigramGame.tsx
// COMPLETE FILE WITH DIFFICULTY FIX

import { useState, useEffect, useCallback } from "react";
import {
  submitPuzzle,
  getSavedAttempt,
  saveProgress,
  checkSubmissionExists,
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
// import { ResumeGameModal } from "../../ui/resumeGameModal";
import { useTimer } from "../../../hooks/useTimer";
import { Timer } from "../../ui/timer";
import { useApi } from "../../../hooks/useApi";
import { LoadingSpinner } from "../../ui/loadingSpinner";
import type { Difficulty } from "../../../pages/gamePage";
import { API_URL } from "../../../api/authService";
import clsx from "clsx";

import click1 from "@/assets/sounds/keyboard_press_1.mp3";
import click2 from "@/assets/sounds/keyboard_press_2.mp3";
import click3 from "@/assets/sounds/keyboard_press_3.mp3";
import success from "@/assets/sounds/success.mp3";
import error from "@/assets/sounds/error.mp3";

import { useSound } from "../../../hooks/useSound";

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
  console.log("[ErnigramGame] ========== COMPONENT MOUNTED ==========");
  console.log("[ErnigramGame] Props received:");
  console.log(
    "[ErnigramGame]   - challengeId:",
    challengeId,
    "(type:",
    typeof challengeId,
    ")"
  );
  console.log("[ErnigramGame]   - difficulty:", difficulty);
  console.log("[ErnigramGame]   - puzzle.id:", puzzle?.id);
  console.log("[ErnigramGame] ===========================================");

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

  // const [showResumeModal, setShowResumeModal] = useState(false);
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

  // ✅ 1. Check for existing submission FIRST
  useEffect(() => {
    if (!dailyPuzzleDate || !puzzleID) {
      setCheckingSubmission(false);
      return;
    }

    console.log("[ErnigramGame] ========== CHECKING SUBMISSION ==========");
    console.log("[ErnigramGame] challengeId:", challengeId);
    setCheckingSubmission(true);

    checkSubmissionExists("ernigram", dailyPuzzleDate, puzzleID)
      .then(async (result) => {
        console.log("[ErnigramGame] Submission check result:", result);
        console.log("[ErnigramGame] result.hasSubmitted:", result.hasSubmitted);
        console.log("[ErnigramGame] result.submissionId:", result.submissionId);
        console.log("[ErnigramGame] result.difficulty:", result.difficulty);

        if (result.hasSubmitted) {
          setAlreadyCompleted(result);
          setIsGameOver(true);

          console.log(
            "[ErnigramGame] ========== SHOULD COMPLETE CHALLENGE? =========="
          );
          console.log("[ErnigramGame] challengeId:", challengeId);
          console.log(
            "[ErnigramGame] result.submissionId:",
            result.submissionId
          );
          console.log(
            "[ErnigramGame] Both truthy?:",
            !!(challengeId && result.submissionId)
          );

          if (challengeId && result.submissionId) {
            console.log(
              "[ErnigramGame] ⚠️ User already submitted - completing challenge now!"
            );
            try {
              console.log(
                "[ErnigramGame] ========== CHALLENGE COMPLETION START =========="
              );
              await completeChallenge(challengeId, {
                submission_id: result.submissionId,
              });
              console.log(
                "[ErnigramGame] ✅ Challenge completed automatically!"
              );
              await new Promise((resolve) => setTimeout(resolve, 2000));
              await refreshChallenges();
              console.log(
                "[ErnigramGame] ========== CHALLENGE COMPLETION END =========="
              );
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

  // ✅ 3. Load saved progress
  useEffect(() => {
    if (alreadyCompleted?.hasSubmitted || checkingSubmission) return;

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
      setSavedTime(savedGame.time_spent_ms);
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

      const hasProgress =
        progress.guessedLetters.length > 0 || savedGame.time_spent_ms > 5000;

      if (hasProgress && !loadedIsGameOver) {
        // setShowResumeModal(true);
      } else if (!loadedIsGameOver) {
        startTimer();
      }
    } else if (!loadedIsGameOver && !loading) {
      startTimer();
    }
  }, [
    savedGame,
    startTimer,
    setSavedTime,
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
      console.log("[ErnigramGame] ========== END GAME CALLED ==========");
      console.log("[ErnigramGame] challengeId:", challengeId);
      console.log("[ErnigramGame] won:", won);

      setIsGameOver(true);
      if (won) {
        setIsWon(true);
      }
      stopTimer();
      const finalTime = time;
      let finalScore = 0;
      let submissionIdForResultModal: number | null = null;
      const triesTaken = maxAttemptsForDifficulty - attemptsLeft;
      let submissionResult: SubmissionResult | null = null;

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

        //await new Promise((resolve) => setTimeout(resolve, 500));

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

        console.log("[ErnigramGame] ========== AFTER SUBMISSION ==========");
        console.log("[ErnigramGame] challengeId:", challengeId);
        console.log(
          "[ErnigramGame] submissionIdForResultModal:",
          submissionIdForResultModal
        );
        console.log(
          "[ErnigramGame] Both truthy?:",
          !!(challengeId && submissionIdForResultModal)
        );

        if (challengeId && submissionIdForResultModal) {
          try {
            console.log(
              "[ErnigramGame] ========== CHALLENGE COMPLETION START =========="
            );
            await completeChallenge(challengeId, {
              submission_id: submissionIdForResultModal,
            });
            console.log("[ErnigramGame] ✅ Challenge API call succeeded!");
            await new Promise((resolve) => setTimeout(resolve, 3000));
            await refreshChallenges();
            console.log("[ErnigramGame] ✅ Challenge flow complete!");
            console.log(
              "[ErnigramGame] ========== CHALLENGE COMPLETION END =========="
            );
          } catch (challengeError) {
            console.error("[ErnigramGame] ❌ Challenge error:", challengeError);
            await refreshChallenges();
          }
        }
      } catch (err) {
        console.error("[ErnigramGame] Error during end:", err);
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
      guessedLetters,
      solution,
      refreshChallenges,
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

      saveImmediately(newGuessedLetters, newAttemptsLeft);
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

  // const handleContinue = () => {
  //   // setShowResumeModal(false);
  //   startTimer();
  // };

  if (checkingSubmission || loading) {
    return <LoadingSpinner fullPage={true} />;
  }

  // ✅ CRITICAL FIX: Use difficulty from alreadyCompleted, not lockedDifficulty
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
      {/* {showResumeModal && (
        <ResumeGameModal
          guessCount={guessedLetters.length}
          maxGuesses={null}
          puzzleDate={dailyPuzzleDate}
          puzzleNumber={puzzle.id}
          editor="ERNI Team"
          onContinue={handleContinue}
          customMessage={`You've guessed ${guessedLetters.length} letter${guessedLetters.length !== 1 ? "s" : ""} with ${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining.`}
        />
      )} */}

      <div className="grid grid-cols-1 lg:grid-cols-2 items-center p-4">
        <div className="place-content-center p-20 text-xl leading-6 bg-white h-full rounded-3xl">
          <div className="place-content-center p-4 md:p-20 text-xl leading-6 bg-white h-full rounded-3xl">
            {puzzle.employee_image_url != "None" ? (
              <div className="w-full max-w-sm mx-auto">
                <img
                  src={fullImageUrl}
                  alt="Employee to guess"
                  className={clsx(
                    "rounded-lg transition-all duration-700 ease-in-out",
                    !isWon ? "blur-md" : "blur-none"
                  )}
                />
                <p className="text-xl text-black mt-6 mb-6">
                  {"Guess the employee's name!"}
                </p>
              </div>
            ) : (
              <p className="text-xl text-black mb-6">{puzzle.clue}</p>
            )}

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
              // currentStreak={gameResult.currentStreak}
              // maxStreak={gameResult.maxStreak}
              // streakUpdatedToday={gameResult.streakUpdatedToday}
              // message={gameResult.message}
              gameType="ernigram"
              onClose={() => setGameResult(null)}
            />
          )}
        </div>
      </div>
    </>
  );
};
