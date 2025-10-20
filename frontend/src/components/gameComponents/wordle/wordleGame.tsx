// The main logic. It will fetch the puzzle, manage the game state (guesses, current row, letter status), handle keyboard input (from the Keyboard component), and call submitPuzzle() on win or loss.
import { useState, useEffect, useCallback } from 'react';
import type { WordlePuzzle, SubmissionData, PuzzleAttemptData, WordleProgress, KeyStatus } from '../../../types/game';
import { WordleGrid } from './wordleGrid';
import { Keyboard } from './keyboard';
import { submitPuzzle, getSavedAttempt, saveProgress } from '../../../api/gameService';
import { PostGameResultsModal } from '../../ui/postGameResultsModal';
import { useTimer } from '../../../hooks/useTimer';
import { Timer } from '../../ui/timer';
import { useApi } from '../../../hooks/useApi';
import { LoadingSpinner } from '../../ui/loadingSpinner';

interface WordleGameProps {
  puzzle: WordlePuzzle;
}

export const WordleGame = ({ puzzle }: WordleGameProps) => {
  const [solution] = useState(puzzle.solution_word.toUpperCase());
  
  // These states will be initialized by the loading effect
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [currentRow, setCurrentRow] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [letterStatuses, setLetterStatuses] = useState<Record<string, KeyStatus>>({});
  const [gameResult, setGameResult] = useState<{ score: number } | null>(null);

  const { time, startTimer, stopTimer, setSavedTime } = useTimer();

  // --- 1. Load saved game ---
  // Memoize the function that calls getSavedAttempt
  const fetchSavedWordle = useCallback(() => getSavedAttempt('wordle'), []);
  // Now pass the STABLE function to useApi
  const { data: savedGame, loading } = useApi(fetchSavedWordle);

  // --- 2. Effect to load data ---
// 1. Effect to load data
  useEffect(() => {
    if (savedGame && savedGame.puzzle_type === 'wordle') {
      const progress = savedGame.progress_data as WordleProgress;
      setGuesses(progress.guesses);
      setCurrentRow(progress.currentRow);
      setLetterStatuses(progress.letterStatuses);
      setIsGameOver(progress.isGameOver);
      setSavedTime(savedGame.time_spent_ms);
    }
    startTimer();
  }, [savedGame, startTimer, setSavedTime]);

  // 2. Effect to auto-save
  useEffect(() => {
    // ... (console logs can stay for now)

    if (loading || (isGameOver && gameResult)) {
      // ...
      return;
    }

    // ...

    const saveTimer = setTimeout(() => {
      // ...
      const progress: WordleProgress = {
        guesses,
        currentRow,
        letterStatuses,
        isGameOver,
      };
      saveProgress({
        puzzle_id: puzzle.id,
        puzzle_type: 'wordle',
        progress_data: progress,
        // It reads the 'time' state from the closure here
        time_spent_ms: time,
      });
    }, 2000);

    return () => {
      // ...
      clearTimeout(saveTimer);
    };
    // --- THIS IS THE FIX ---
    // Remove 'time' from this dependency array
  }, [guesses, currentRow, /*letterStatuses,*/ isGameOver, /*time,*/ loading, gameResult, puzzle.id]);
  // --- END FIX ---

  // 3. Memoized handleKeyPress
  const handleKeyPress = useCallback((key: string) => {
    if (isGameOver) return;

    if (key === 'Enter') {
      if (currentGuess.length === 5) {
        // (rest of submit guess logic...)
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
          endGame(newRow);
        } else if (newRow === 6) {
          endGame(6, false);
        }
      }
    } else if (key === 'Backspace') {
      setCurrentGuess(g => g.slice(0, -1));
    } else if (currentGuess.length < 5 && /^[a-zA-Z]$/.test(key)) {
      setCurrentGuess(g => g + key.toUpperCase());
    }
  }, [isGameOver, currentGuess, guesses, currentRow, letterStatuses, solution, puzzle.id]); // Added puzzle.id

  // 4. endGame (not a hook, just a function)
  const endGame = async (tries: number, won: boolean = true) => {
    setIsGameOver(true);
    stopTimer();
    const finalTime = time;

    const submission: SubmissionData = {
      puzzle_id: puzzle.id,
      puzzle_type: 'wordle',
      time_taken_ms: finalTime,
      tries: tries,
    };
    const result = await submitPuzzle(submission);
    setGameResult(result);
  };

  // 5. Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      handleKeyPress(e.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  // --- THIS IS THE FIX ---
  // The loading check is NOW at the end, right before the return.
  if (loading) {
    return <LoadingSpinner fullPage={true} />;
  }
  // --- END OF FIX ---
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
      />
      
      <Keyboard onKeyPress={handleKeyPress} letterStatuses={letterStatuses} />
      
      {gameResult && (
        <PostGameResultsModal
          score={gameResult.score}
          onClose={() => setGameResult(null)}
        />
      )}
    </div>
  );
};