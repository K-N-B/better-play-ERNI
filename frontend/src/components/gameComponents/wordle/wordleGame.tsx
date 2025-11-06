// src/components/gameComponents/wordle/wordleGame.tsx - COMPLETE FILE WITH DEBUG
import confetti from "canvas-confetti";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  submitPuzzle,
  getSavedAttempt,
  saveProgress,
  checkSubmissionExists,
} from "../../../api/gameService";
import { completeChallenge } from "../../../api/challengeService";
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
// import { ResumeGameModal } from '../../ui/resumeGameModal';
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
  // // ✅ DEBUG: Component mounted
  // console.log('[WordleGame] ========== COMPONENT MOUNTED ==========');
  // console.log('[WordleGame] Props received:');
  // console.log('[WordleGame]   - challengeId:', challengeId, '(type:', typeof challengeId, ')');
  // console.log('[WordleGame]   - difficulty:', difficulty);
  // console.log('[WordleGame]   - puzzle.id:', puzzle?.id);
  // console.log('[WordleGame] ===========================================');
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

  // Check for existing submission FIRST
  useEffect(() => {
    if (!puzzle?.date_to_be_used || !puzzle?.id) {
      setCheckingSubmission(false);
      return;
    }

    console.log("[WordleGame] ========== CHECKING SUBMISSION ==========");
    console.log("[WordleGame] challengeId:", challengeId);
    setCheckingSubmission(true);

    checkSubmissionExists("wordle", puzzle.date_to_be_used, puzzle.id)
      .then(async (result) => {
        console.log("[WordleGame] Submission check result:", result);
        console.log("[WordleGame] result.hasSubmitted:", result.hasSubmitted);
        console.log("[WordleGame] result.submissionId:", result.submissionId);
        console.log("[WordleGame] challengeId (in then):", challengeId);

        if (result.hasSubmitted) {
          setAlreadyCompleted(result);
          setIsGameOver(true);

          // // ✅ DEBUG: Should we complete challenge?
          // console.log('[WordleGame] ========== SHOULD COMPLETE CHALLENGE? ==========');
          // console.log('[WordleGame] challengeId:', challengeId);
          // console.log('[WordleGame] result.submissionId:', result.submissionId);
          // console.log('[WordleGame] Both truthy?:', !!(challengeId && result.submissionId));
          // console.log('[WordleGame] ===========================================');

          if (challengeId && result.submissionId) {
            console.log(
              "[WordleGame] ⚠️ User already submitted - completing challenge now!"
            );
            try {
              console.log(
                "[WordleGame] ========== CHALLENGE COMPLETION START =========="
              );
              console.log("[WordleGame] Challenge ID:", challengeId);
              console.log("[WordleGame] Submission ID:", result.submissionId);

              const challengeResult = await completeChallenge(challengeId, {
                submission_id: result.submissionId,
              });

              console.log("[WordleGame] ✅ Challenge API call succeeded!");
              console.log(
                "[WordleGame] Response:",
                JSON.stringify(challengeResult, null, 2)
              );

              await new Promise((resolve) => setTimeout(resolve, 2000));

              console.log("[WordleGame] Refreshing challenge count...");
              await refreshChallenges();
              console.log("[WordleGame] ✅ Challenge completed automatically!");
              console.log(
                "[WordleGame] ========== CHALLENGE COMPLETION END =========="
              );
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
    if (alreadyCompleted?.hasSubmitted) return;

    let loadedIsGameOver = false;
    if (savedGame && savedGame.puzzle_type === "wordle") {
      const progress = savedGame.progress_data as WordleProgress;
      setGuesses(progress.guesses || []);
      setCurrentRow(progress.currentRow || 0);
      setLetterStatuses(progress.letterStatuses || {});
      setIsGameOver(progress.isGameOver || false);
      setSavedTime(savedGame.time_spent_ms);
      loadedIsGameOver = progress.isGameOver;
      console.log("[WordleGame] Saved data loaded.");

      const hasProgress =
        (progress.guesses?.length ?? 0) > 0 || savedGame.time_spent_ms > 5000;

      if (hasProgress && !loadedIsGameOver) {
        // console.log('[WordleGame] Showing resume modal');
        // setShowResumeModal(true);
      } else if (!loadedIsGameOver) {
        console.log("[WordleGame] Starting timer - no resume needed");
        startTimer();
      }
    } else if (!loadedIsGameOver) {
      console.log("[WordleGame] Starting timer - no saved game");
      startTimer();
    }
  }, [savedGame, startTimer, setSavedTime, alreadyCompleted]);

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

      console.log("[WordleGame] ========== END GAME CALLED ==========");
      console.log("[WordleGame] challengeId:", challengeId);
      console.log("[WordleGame] tries:", tries);
      console.log("[WordleGame] won:", won);

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
        };

        const submissionResult = await submitPuzzle(
          submissionData,
          puzzle.date_to_be_used,
          puzzle.id
        );

        finalScore = submissionResult.score;
        submissionIdForResultModal = submissionResult.submissionId ?? null;

        // ✅ DEBUG: After submission
        console.log("[WordleGame] ========== AFTER SUBMISSION ==========");
        console.log("[WordleGame] challengeId:", challengeId);
        console.log(
          "[WordleGame] submissionIdForResultModal:",
          submissionIdForResultModal
        );
        console.log(
          "[WordleGame] Both truthy?:",
          !!(challengeId && submissionIdForResultModal)
        );
        console.log("[WordleGame] =======================================");

        if (challengeId && submissionIdForResultModal) {
          try {
            console.log(
              "[WordleGame] ========== CHALLENGE COMPLETION START =========="
            );
            console.log("[WordleGame] Challenge ID:", challengeId);
            console.log(
              "[WordleGame] Submission ID:",
              submissionIdForResultModal
            );
            console.log("[WordleGame] Won:", won);

            const challengeResult = await completeChallenge(challengeId, {
              submission_id: submissionIdForResultModal,
            });

            console.log("[WordleGame] ✅ Challenge API call succeeded!");
            console.log(
              "[WordleGame] Response:",
              JSON.stringify(challengeResult, null, 2)
            );

            await new Promise((resolve) => setTimeout(resolve, 3000));

            console.log("[WordleGame] Refreshing challenge count...");
            await refreshChallenges();
            console.log("[WordleGame] ✅ Challenge flow complete!");
            console.log(
              "[WordleGame] ========== CHALLENGE COMPLETION END =========="
            );
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
              onClose={() => setGameResult(null)}
            />
          )}
        </div>
      </div>
    </>
  );
};
