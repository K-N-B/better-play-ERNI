import React, { useState, useEffect, useCallback } from 'react';
import { submitPuzzle, getSavedAttempt, saveProgress } from '../../../api/gameService'; // Adjust path
import { completeChallenge } from '../../../api/challengeService'
import type { ErnigramPuzzle, SubmissionData, PuzzleAttemptData, ErnigramProgress, KeyStatus } from '../../../types/game';
import { PhraseDisplay } from './phraseDisplay';
import { AttemptsTracker } from './attemptsTracker';
import { Keyboard } from '../wordle/keyboard';
import { PostGameResultsModal } from '../../ui/postGameResultsModal';
import { useTimer } from '../../../hooks/useTimer';
import { Timer } from '../../ui/timer';
import { useApi } from '../../../hooks/useApi';
import { LoadingSpinner } from '../../ui/loadingSpinner';
import type { Difficulty } from '../../../pages/gamePage'; // Adjust path

interface ErnigramGameProps {
  puzzle: ErnigramPuzzle;
  difficulty: Difficulty;
  challengeId: number | null;
}

const MAX_ATTEMPTS = (difficulty: Difficulty) => difficulty === 'hard' ? 3 : 6;

export const ErnigramGame = ({ puzzle, difficulty, challengeId }: ErnigramGameProps) => {
  const [solution] = useState(puzzle.solution_phrase.toUpperCase());
  const maxAttemptsForDifficulty = MAX_ATTEMPTS(difficulty);

  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [attemptsLeft, setAttemptsLeft] = useState(() => MAX_ATTEMPTS(difficulty));
  const [isGameOver, setIsGameOver] = useState(false);
  const [letterStatuses, setLetterStatuses] = useState<Record<string, KeyStatus>>({});
  const [gameResult, setGameResult] = useState<{ score: number; submissionId: number | null } | null>(null);

  const { time, startTimer, stopTimer, setSavedTime } = useTimer();
  const fetchSavedErnigram = useCallback(() => getSavedAttempt('ernigram'), []);
  const { data: savedGame, loading } = useApi(fetchSavedErnigram);

  // Effect to load data
  useEffect(() => {
    let loadedIsGameOver = false;
    if (savedGame && savedGame.puzzle_type === 'ernigram') {
      const progress = savedGame.progress_data as ErnigramProgress;
      setGuessedLetters(progress.guessedLetters);
      // Recalculate attemptsLeft based on saved guesses and current difficulty
      const incorrectGuesses = progress.guessedLetters.filter(g => !solution.includes(g)).length;
      const currentMax = MAX_ATTEMPTS(difficulty); // Use current difficulty setting
      setAttemptsLeft(Math.max(0, currentMax - incorrectGuesses));
      setIsGameOver(progress.isGameOver);
      setSavedTime(savedGame.time_spent_ms);
      loadedIsGameOver = progress.isGameOver;

      const newStatuses: Record<string, KeyStatus> = {};
      progress.guessedLetters.forEach(char => {
         if (solution.includes(char)) newStatuses[char] = 'correct';
         else newStatuses[char] = 'absent';
      });
      setLetterStatuses(newStatuses);
    }
     if (!loadedIsGameOver) {
        startTimer();
    }
  }, [savedGame, startTimer, setSavedTime, solution, difficulty]); // Added difficulty dependency

  // Effect to auto-save
  useEffect(() => {
    if (loading || isGameOver) return;
    const saveTimer = setTimeout(() => {
      const progress: ErnigramProgress = { guessedLetters, attemptsLeft, isGameOver };
      saveProgress({
        puzzle_id: puzzle.id,
        puzzle_type: 'ernigram',
        progress_data: progress,
        time_spent_ms: time,
      });
    }, 2000);
    return () => clearTimeout(saveTimer);
  }, [guessedLetters, attemptsLeft, isGameOver, time, loading, puzzle.id]); // Removed gameResult


  // handleKeyPress callback
  const handleKeyPress = useCallback((key: string) => {
    if (isGameOver || key.length > 1) return;
    const char = key.toUpperCase();
    if (guessedLetters.includes(char) || !/^[A-Z]$/.test(char)) return; // Only letters, ignore non-alpha

    const newGuessedLetters = [...guessedLetters, char];
    setGuessedLetters(newGuessedLetters);
    let newAttemptsLeft = attemptsLeft;
    const newStatuses = { ...letterStatuses };

    if (solution.includes(char)) {
      newStatuses[char] = 'correct'; // Or maybe 'present' if you want Wordle style?
    } else {
      newStatuses[char] = 'absent';
      newAttemptsLeft = attemptsLeft - 1;
      setAttemptsLeft(newAttemptsLeft);
    }
    setLetterStatuses(newStatuses);
    checkGameState(newGuessedLetters, newAttemptsLeft);

  }, [isGameOver, guessedLetters, solution, attemptsLeft, letterStatuses]);

  // checkGameState callback
  const checkGameState = useCallback((currentGuesses: string[], currentAttempts: number) => {
    // Only check letters, ignore spaces for win condition
    const uniqueLetters = [...new Set(solution.replace(/ /g, ''))];
    const hasWon = uniqueLetters.every(char => currentGuesses.includes(char));

    if (hasWon) {
      endGame(true);
    } else if (currentAttempts <= 0) {
      endGame(false);
    }
  }, [solution]);

  // endGame function
  const endGame = async (won: boolean) => {
    if (isGameOver) return;
    setIsGameOver(true);
    stopTimer();
    const finalTime = time;
    let finalScore = 0;
    let submissionIdForResultModal: number | null = null;
    const triesTaken = maxAttemptsForDifficulty - attemptsLeft;

    try {
      if (won) {
         const submissionData: SubmissionData = {
           puzzle_id: puzzle.id,
           puzzle_type: 'ernigram',
           time_taken_ms: finalTime,
           tries: triesTaken, // Number of incorrect guesses? Or total guesses? Check rules.
         };
         const submissionResult = await submitPuzzle(submissionData);
         finalScore = submissionResult.score;
         submissionIdForResultModal = submissionResult.submissionId ?? null;

         if (challengeId && submissionIdForResultModal) {
             await completeChallenge(challengeId, { submission_id: submissionIdForResultModal });
         } else if (challengeId) {
              console.error("[ErnigramGame] Challenge ID present but failed to get submission ID.");
         }
      } else {
        finalScore = 0;
        submissionIdForResultModal = null;
         if (challengeId) { /* ... (handle challenge loss) ... */ }
      }
    } catch (err) {
      console.error("Error during Ernigram end:", err);
    } finally {
        setGameResult({ score: finalScore, submissionId: submissionIdForResultModal });
    }
  };

  // Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process single letters
      if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  if (loading) {
    return <LoadingSpinner fullPage={true} />;
  }

  return (
    <div className="flex flex-col items-center p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">ERNIgram</h1>
      <p className="text-xl text-gray-600 mb-6">{puzzle.clue}</p>

      <div className="flex justify-between w-full max-w-sm items-center mb-4">
        <AttemptsTracker attemptsLeft={attemptsLeft} />
        <Timer timeMs={time} />
      </div>

      <PhraseDisplay solutionPhrase={solution} guessedLetters={guessedLetters} />

      {/* Disable keyboard when game is over */}
      <div className={isGameOver ? 'opacity-50 pointer-events-none' : ''}>
        <Keyboard
          onKeyPress={handleKeyPress}
          letterStatuses={letterStatuses}
        />
      </div>

      {gameResult && (
        <PostGameResultsModal
          score={gameResult.score}
          submissionId={gameResult.submissionId}
          onClose={() => setGameResult(null)}
        />
      )}
    </div>
  );
};