import { useState, useEffect, useCallback } from 'react';
import type { WordlePuzzle, SubmissionData, PuzzleAttemptData, WordleProgress } from '../../../types/game';
import { WordleGrid } from './wordleGrid';
import { Keyboard } from './keyboard';
import { submitPuzzle, getSavedAttempt, saveProgress, validateWordleGuess } from '../../../api/gameService';
import { PostGameResultsModal } from '../../ui/postGameResultsModal';
import { useTimer } from '../../../hooks/useTimer';
import { Timer } from '../../ui/timer';
import { useApi } from '../../../hooks/useApi';
import { LoadingSpinner } from '../../ui/loadingSpinner';
import type { Difficulty } from '../../../pages/gamePage';

type KeyStatus = 'correct' | 'present' | 'absent' | 'default';
type GuessStatus = 'correct' | 'present' | 'absent';

interface WordleGameProps {
  puzzle: WordlePuzzle;
  difficulty: Difficulty;
}

export const WordleGame = ({ puzzle, difficulty }: WordleGameProps) => {
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [currentRow, setCurrentRow] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [letterStatuses, setLetterStatuses] = useState<Record<string, KeyStatus>>({});
  const [gameResult, setGameResult] = useState<{ score: number } | null>(null);
  const [guessStatuses, setGuessStatuses] = useState<GuessStatus[][]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const { time, startTimer, stopTimer, setSavedTime } = useTimer();
  const MAX_GUESSES = difficulty === 'hard' ? 5 : 6;

  // Load saved game
  const fetchSavedWordle = useCallback(() => getSavedAttempt('wordle'), []);
  const { data: savedGame, loading } = useApi(fetchSavedWordle);

  // Effect to load saved data
  useEffect(() => {
    if (savedGame && savedGame.puzzle_type === 'wordle') {
      const progress = savedGame.progress_data as WordleProgress;
      setGuesses(progress.guesses);
      setCurrentRow(progress.currentRow);
      setLetterStatuses(progress.letterStatuses);
      setIsGameOver(progress.isGameOver);
      setSavedTime(savedGame.time_spent_ms);
      
      // TODO: We might want to save guessStatuses too for perfect reload
    }
    startTimer();
  }, [savedGame, startTimer, setSavedTime]);

  // Auto-save progress every 2 seconds
  useEffect(() => {
    if (loading || (isGameOver && gameResult)) {
      return;
    }

    const saveTimer = setTimeout(() => {
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
        time_spent_ms: time,
      }).catch(err => {
        console.error('Failed to save progress:', err);
      });
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [guesses, currentRow, isGameOver, loading, gameResult, puzzle.id, time, letterStatuses]);

  // Handle keyboard input
  const handleKeyPress = useCallback(async (key: string) => {
    if (isGameOver || isValidating) return;

    if (key === 'Enter') {
      if (currentGuess.length === 5) {
        setIsValidating(true);
        
        try {
          // Validate guess with backend
          const validation = await validateWordleGuess(puzzle.id, currentGuess);
          
          // Update guesses and statuses
          const newGuesses = [...guesses, currentGuess];
          const newGuessStatuses = [...guessStatuses, validation.statuses];
          const newRow = currentRow + 1;
          
          // Update letter statuses for keyboard
          const updatedLetterStatuses = { ...letterStatuses };
          Object.entries(validation.letter_statuses).forEach(([letter, status]) => {
            const currentStatus = updatedLetterStatuses[letter] || 'default';
            // Priority: correct > present > absent
            if (status === 'correct' || 
                (status === 'present' && currentStatus !== 'correct') ||
                (status === 'absent' && currentStatus === 'default')) {
              updatedLetterStatuses[letter] = status;
            }
          });
          
          setGuesses(newGuesses);
          setGuessStatuses(newGuessStatuses);
          setCurrentRow(newRow);
          setLetterStatuses(updatedLetterStatuses);
          setCurrentGuess('');
          
          // Check if won
          if (validation.is_correct) {
            endGame(newRow, true);
          } 
          // Check if lost (used all guesses)
          else if (newRow >= MAX_GUESSES) {
            endGame(newRow, false);
          }
        } catch (error: any) {
          console.error('Failed to validate guess:', error);
          alert('Failed to validate guess. Please try again.');
        } finally {
          setIsValidating(false);
        }
      }
    } else if (key === 'Backspace') {
      setCurrentGuess(g => g.slice(0, -1));
    } else if (currentGuess.length < 5 && /^[a-zA-Z]$/.test(key)) {
      setCurrentGuess(g => g + key.toUpperCase());
    }
  }, [isGameOver, isValidating, currentGuess, guesses, currentRow, letterStatuses, puzzle.id, MAX_GUESSES, guessStatuses]);

  // End game and submit
  const endGame = async (tries: number, won: boolean) => {
    setIsGameOver(true);
    stopTimer();
    const finalTime = time;
    
    const submission: SubmissionData = {
      puzzle_id: puzzle.id,
      puzzle_type: 'wordle',
      time_taken_ms: finalTime,
      tries: tries,
    };
    
    try {
      const result = await submitPuzzle(submission);
      setGameResult(result);
    } catch (error: any) {
      console.error('Failed to submit puzzle:', error);
      alert('Failed to submit puzzle. Please try again.');
      setIsGameOver(false);
      startTimer();
    }
  };

  // Keyboard event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      handleKeyPress(e.key);
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
        guessStatuses={guessStatuses}
        currentRow={currentRow}
        maxGuesses={MAX_GUESSES}
      />
      
      <Keyboard onKeyPress={handleKeyPress} letterStatuses={letterStatuses} />
      
      {isValidating && (
        <div className="mt-4 text-gray-600">Validating guess...</div>
      )}
      
      {gameResult && (
        <PostGameResultsModal
          score={gameResult.score}
          onClose={() => setGameResult(null)}
        />
      )}
    </div>
  );
};