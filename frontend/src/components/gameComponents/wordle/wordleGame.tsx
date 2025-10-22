import React, { useState, useEffect, useCallback } from 'react';
import { submitPuzzle, getSavedAttempt, saveProgress } from '../../../api/gameService'; // Adjust path if needed
import { completeChallenge } from '../../../api/challengeService';
import type { WordlePuzzle, SubmissionData, PuzzleAttemptData, WordleProgress, KeyStatus } from '../../../types/game';
import { WordleGrid } from './wordleGrid';
import { Keyboard } from './keyboard';
import { PostGameResultsModal } from '../../ui/postGameResultsModal';
import { useTimer } from '../../../hooks/useTimer';
import { Timer } from '../../ui/timer';
import { useApi } from '../../../hooks/useApi';
import { LoadingSpinner } from '../../ui/loadingSpinner';
import type { Difficulty } from '../../../pages/gamePage'; // Adjust path if needed

interface WordleGameProps {
  puzzle: WordlePuzzle;
  difficulty: Difficulty;
  challengeId: number | null;
}

export const WordleGame = ({ puzzle, difficulty, challengeId }: WordleGameProps) => {
  const [solution] = useState(puzzle.solution_word.toUpperCase());
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [currentRow, setCurrentRow] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [letterStatuses, setLetterStatuses] = useState<Record<string, KeyStatus>>({});
  const [gameResult, setGameResult] = useState<{ score: number; submissionId: number | null } | null>(null);

  const { time, startTimer, stopTimer, setSavedTime } = useTimer();
  const fetchSavedWordle = useCallback(() => getSavedAttempt('wordle'), []);
  const { data: savedGame, loading } = useApi(fetchSavedWordle);

  const MAX_GUESSES = difficulty === 'hard' ? 5 : 6;

  // Effect to load data
  useEffect(() => {
    let loadedIsGameOver = false;
    if (savedGame && savedGame.puzzle_type === 'wordle') {
      const progress = savedGame.progress_data as WordleProgress;
      setGuesses(progress.guesses);
      setCurrentRow(progress.currentRow);
      setLetterStatuses(progress.letterStatuses);
      setIsGameOver(progress.isGameOver);
      setSavedTime(savedGame.time_spent_ms);
      loadedIsGameOver = progress.isGameOver;
    }
    if (!loadedIsGameOver) {
        startTimer();
    }
  }, [savedGame, startTimer, setSavedTime]);

  // Effect to auto-save
  useEffect(() => {
    if (loading || isGameOver) return;

    const saveTimer = setTimeout(() => {
      const progress: WordleProgress = { guesses, currentRow, letterStatuses, isGameOver };
      saveProgress({
        puzzle_id: puzzle.id,
        puzzle_type: 'wordle',
        progress_data: progress,
        time_spent_ms: time,
      });
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [guesses, currentRow, /*letterStatuses,*/ isGameOver, time, loading, puzzle.id]); // Removed letterStatuses & gameResult

  // handleKeyPress callback
  const handleKeyPress = useCallback((key: string) => {
    if (isGameOver) return;

    if (key === 'Enter') {
      if (currentGuess.length === 5) {
        // Basic check if word is valid (replace with real dictionary check later)
        if (currentGuess.length !== 5) {
            console.warn("Invalid guess length"); // Add user feedback later
            return;
        }

        const newGuesses = [...guesses, currentGuess];
        const newRow = currentRow + 1;
        const newStatuses = { ...letterStatuses };
        currentGuess.split('').forEach((char, i) => {
          if (solution[i] === char) newStatuses[char] = 'correct';
          else if (solution.includes(char) && newStatuses[char] !== 'correct') newStatuses[char] = 'present';
          else if (!solution.includes(char)) newStatuses[char] = 'absent';
        });

        setGuesses(newGuesses);
        setCurrentRow(newRow);
        setLetterStatuses(newStatuses);
        setCurrentGuess('');

        if (currentGuess === solution) {
          endGame(newRow, true);
        } else if (newRow >= MAX_GUESSES) {
          endGame(MAX_GUESSES, false);
        }
      } else {
          console.warn("Guess must be 5 letters"); // Add user feedback later
      }
    } else if (key === 'Backspace') {
      setCurrentGuess(g => g.slice(0, -1));
    } else if (currentGuess.length < 5 && /^[a-zA-Z]$/.test(key)) { // Only allow letters
      setCurrentGuess(g => g + key.toUpperCase());
    }
  }, [isGameOver, currentGuess, guesses, currentRow, letterStatuses, solution, puzzle.id, MAX_GUESSES]);

  // endGame function
  const endGame = async (tries: number, won: boolean) => {
    if (isGameOver) return;
    setIsGameOver(true);
    stopTimer();
    const finalTime = time;
    let finalScore = 0;
    let submissionIdForResultModal: number | null = null;

    try {
      const submissionData: SubmissionData = {
        puzzle_id: puzzle.id,
        puzzle_type: 'wordle',
        time_taken_ms: finalTime,
        tries: tries,
      };
      // Assume submitPuzzle returns { score: number, submissionId: number }
      const submissionResult = await submitPuzzle(submissionData);
      finalScore = submissionResult.score;
      submissionIdForResultModal = submissionResult.submissionId ?? null; // Use nullish coalescing

      if (challengeId && submissionIdForResultModal) {
        console.log(`[WordleGame] Completing challenge ${challengeId} with submission ${submissionIdForResultModal}`);
        await completeChallenge(challengeId, { submission_id: submissionIdForResultModal });
        console.log(`[WordleGame] Challenge ${challengeId} marked as complete.`);
      } else if (challengeId) {
         console.error("[WordleGame] Challenge ID present but failed to get submission ID.");
      }
    } catch (err) {
      console.error("Error during game end submission/challenge completion:", err);
    } finally {
       setGameResult({ score: finalScore, submissionId: submissionIdForResultModal });
    }
  };

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Map Backspace and Enter keys
      if (e.key === 'Enter' || e.key === 'Backspace') {
          handleKeyPress(e.key);
      } else if (/^[a-zA-Z]$/.test(e.key)) {
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
    <div className="flex flex-col items-center p-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center w-full max-w-sm mb-4">
        <h1 className="text-3xl font-bold">Wordle</h1>
        <Timer timeMs={time} />
      </div>

      <WordleGrid
        guesses={guesses}
        currentGuess={currentGuess}
        solution={solution}
        currentRow={currentRow}
        maxGuesses={MAX_GUESSES}
      />

      <Keyboard onKeyPress={handleKeyPress} letterStatuses={letterStatuses} />

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