// The main logic. It will fetch the puzzle, manage the game state (guesses, current row, letter status), handle keyboard input (from the Keyboard component), and call submitPuzzle() on win or loss.
import { useState, useEffect, useCallback } from 'react';
import type { WordlePuzzle, SubmissionData } from '../../../types/game';
import { WordleGrid } from './wordleGrid';
import { Keyboard } from './keyboard';
import { submitPuzzle } from '../../../api/gameService';
import { PostGameResultsModal } from '../../ui/postGameResultsModal'; // We'll create this next

interface WordleGameProps {
  puzzle: WordlePuzzle;
}

type KeyStatus = 'correct' | 'present' | 'absent' | 'default';

export const WordleGame = ({ puzzle }: WordleGameProps) => {
  const [solution, setSolution] = useState(puzzle.solution_word.toUpperCase());
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [currentRow, setCurrentRow] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [letterStatuses, setLetterStatuses] = useState<Record<string, KeyStatus>>({});
  const [gameResult, setGameResult] = useState<{ score: number } | null>(null);

  // --- Game Logic ---
  const handleKeyPress = useCallback((key: string) => {
    if (isGameOver) return;

    if (key === 'Enter') {
      if (currentGuess.length === 5) {
        // --- SUBMIT GUESS ---
        const newGuesses = [...guesses, currentGuess];
        setGuesses(newGuesses);
        setCurrentRow(row => row + 1);
        
        // --- UPDATE KEYBOARD COLORS ---
        const newStatuses = { ...letterStatuses };
        currentGuess.split('').forEach((char, i) => {
          if (solution[i] === char) newStatuses[char] = 'correct';
          else if (solution.includes(char) && newStatuses[char] !== 'correct') newStatuses[char] = 'present';
          else if (!solution.includes(char)) newStatuses[char] = 'absent';
        });
        setLetterStatuses(newStatuses);
        
        setCurrentGuess(''); // Clear the current guess

        // --- CHECK FOR WIN/LOSS ---
        if (currentGuess === solution) {
          endGame(newGuesses.length);
        } else if (newGuesses.length === 6) {
          endGame(6, false); // Lost
        }
      }
    } else if (key === 'Backspace') {
      setCurrentGuess(g => g.slice(0, -1));
    } else if (currentGuess.length < 5 && /^[a-zA-Z]$/.test(key)) {
      setCurrentGuess(g => g + key.toUpperCase());
    }
  }, [currentGuess, guesses, isGameOver, solution, letterStatuses, puzzle.id]); // Add all dependencies

  // --- End Game Function ---
  const endGame = async (tries: number, won: boolean = true) => {
    setIsGameOver(true);
    // TODO: Add real timer
    const submission: SubmissionData = {
      puzzle_id: puzzle.id,
      puzzle_type: 'wordle',
      time_taken_ms: 120000, 
      tries: tries,
    };
    const result = await submitPuzzle(submission);
    setGameResult(result);
  };

  // --- Keyboard Event Listener ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow user to use physical keyboard
      handleKeyPress(e.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]); // Pass the memoized handleKeyPress

  return (
    <div className="flex flex-col items-center p-4 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-4">Wordle</h1>
      
      <WordleGrid
        guesses={guesses}
        currentGuess={currentGuess}
        solution={solution}
        currentRow={currentRow}
      />
      
      <Keyboard onKeyPress={handleKeyPress} letterStatuses={letterStatuses} />
      
      {/* This will show the results modal when gameResult is set */}
      {gameResult && (
        <PostGameResultsModal
          score={gameResult.score}
          onClose={() => setGameResult(null)} // Allows user to close modal
        />
      )}
    </div>
  );
};