import { useState, useEffect, useCallback } from 'react';
import type { ErnigramPuzzle, SubmissionData, PuzzleAttemptData, ErnigramProgress, KeyStatus } from '../../../types/game';
import { PhraseDisplay } from './phraseDisplay';
import { AttemptsTracker } from './attemptsTracker';
import { Keyboard } from '../wordle/keyboard';
import { submitPuzzle, getSavedAttempt, saveProgress } from '../../../api/gameService';
import { PostGameResultsModal } from '../../ui/postGameResultsModal';
import { useTimer } from '../../../hooks/useTimer';
import { Timer } from '../../ui/timer';
import { useApi } from '../../../hooks/useApi';
import { LoadingSpinner } from '../../ui/loadingSpinner';

interface ErnigramGameProps {
  puzzle: ErnigramPuzzle;
}

const MAX_ATTEMPTS = 6;

export const ErnigramGame = ({ puzzle }: ErnigramGameProps) => {
  const [solution] = useState(puzzle.solution_phrase.toUpperCase());
  
  // States to be loaded/saved
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [isGameOver, setIsGameOver] = useState(false);
  
  // Other states
  const [letterStatuses, setLetterStatuses] = useState<Record<string, KeyStatus>>({});
  const [gameResult, setGameResult] = useState<{ score: number } | null>(null);
  
  const { time, startTimer, stopTimer, setSavedTime } = useTimer();

  // --- 1. Load saved game ---
  const fetchSavedErnigram = useCallback(() => getSavedAttempt('ernigram'), []);
  const { data: savedGame, loading } = useApi(fetchSavedErnigram);

  // --- 2. Effect to load data ---
// --- ALL HOOKS ARE NOW CALLED UNCONDITIONALLY ---

  // 1. Effect to load data
  useEffect(() => {
    if (savedGame && savedGame.puzzle_type === 'ernigram') {
      const progress = savedGame.progress_data as ErnigramProgress;
      setGuessedLetters(progress.guessedLetters);
      setAttemptsLeft(progress.attemptsLeft);
      setIsGameOver(progress.isGameOver);
      setSavedTime(savedGame.time_spent_ms);
      
      const newStatuses: Record<string, KeyStatus> = {};
      progress.guessedLetters.forEach(char => {
         if (solution.includes(char)) newStatuses[char] = 'correct';
         else newStatuses[char] = 'absent';
      });
      setLetterStatuses(newStatuses);
    }
    startTimer();
  }, [savedGame, startTimer, setSavedTime, solution]);

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
      const progress: ErnigramProgress = {
        guessedLetters,
        attemptsLeft,
        isGameOver,
      };
      saveProgress({
        puzzle_id: puzzle.id,
        puzzle_type: 'ernigram',
        progress_data: progress,
        // Reads the 'time' state from the closure
        time_spent_ms: time,
      });
    }, 2000);

    return () => {
      // ...
      clearTimeout(saveTimer);
    };
    // --- THIS IS THE FIX ---
    // Remove 'time' from this dependency array
  }, [guessedLetters, attemptsLeft, /*letterStatuses is not used here*/ isGameOver, /*time,*/ loading, gameResult, puzzle.id]);

  // 3. Memoized handleKeyPress
  const handleKeyPress = useCallback((key: string) => {
    if (isGameOver || key.length > 1) return;

    const char = key.toUpperCase();
    if (guessedLetters.includes(char)) return;

    const newGuessedLetters = [...guessedLetters, char];
    setGuessedLetters(newGuessedLetters);

    let newAttemptsLeft = attemptsLeft;
    const newStatuses = { ...letterStatuses };

    if (solution.includes(char)) {
      newStatuses[char] = 'correct';
    } else {
      newStatuses[char] = 'absent';
      newAttemptsLeft = attemptsLeft - 1;
      setAttemptsLeft(newAttemptsLeft);
    }
    setLetterStatuses(newStatuses);

    checkGameState(newGuessedLetters, newAttemptsLeft);

  }, [isGameOver, guessedLetters, solution, attemptsLeft, letterStatuses]);

  // 4. checkGameState (not a hook)
  const checkGameState = (currentGuesses: string[], currentAttempts: number) => {
    const uniqueLetters = [...new Set(solution.replace(/ /g, ''))];
    const hasWon = uniqueLetters.every(char => currentGuesses.includes(char));

    if (hasWon) {
      endGame(true);
    } else if (currentAttempts <= 0) {
      endGame(false);
    }
  };

  // 5. endGame (not a hook)
  const endGame = async (won: boolean) => {
    setIsGameOver(true);
    stopTimer();
    const finalTime = time;

    const submission: SubmissionData = {
      puzzle_id: puzzle.id,
      puzzle_type: 'ernigram',
      time_taken_ms: finalTime,
      tries: MAX_ATTEMPTS - (won ? attemptsLeft : 0),
    };
    
    if (won) {
      const result = await submitPuzzle(submission);
      setGameResult(result);
    } else {
      setGameResult({ score: 0 }); 
    }
  };

  // 6. Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key);
      }
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
    <div className="flex flex-col items-center p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">ERNIgram</h1>
      <p className="text-xl text-gray-600 mb-6">{puzzle.clue}</p>
      
      <div className="flex justify-between w-full max-w-sm items-center mb-4">
        <AttemptsTracker attemptsLeft={attemptsLeft} />
        <Timer timeMs={time} />
      </div>

      <PhraseDisplay solutionPhrase={solution} guessedLetters={guessedLetters} />
      
      <Keyboard 
        onKeyPress={handleKeyPress}
        letterStatuses={letterStatuses}
      />
      
      {gameResult && (
        <PostGameResultsModal
          score={gameResult.score}
          onClose={() => setGameResult(null)}
        />
      )}
    </div>
  );
};