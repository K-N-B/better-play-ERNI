import { useState, useEffect, useCallback } from 'react';
import { submitPuzzle, getSavedAttempt, saveProgress } from '../../../api/gameService'; // Adjust path if needed
import { completeChallenge } from '../../../api/challengeService';
import type { WordlePuzzle, SubmissionData, PuzzleAttemptData, WordleProgress, KeyStatus, SubmissionResult } from '../../../types/game';
import { WordleGrid } from './wordleGrid';
import { Keyboard } from './keyboard';
import { PostGameResultsModal } from '../../ui/postGameResultsModal';
import { useTimer } from '../../../hooks/useTimer';
import { Timer } from '../../ui/timer';
import { useApi } from '../../../hooks/useApi';
// import { LoadingSpinner } from '../../ui/loadingSpinner';
import type { Difficulty } from '../../../pages/gamePage';


interface WordleGameProps {
  puzzle: WordlePuzzle;
  difficulty: Difficulty;
  challengeId: number | null;
  dailyPuzzleDate: string;
}

export const WordleGame = ({ puzzle, difficulty, challengeId, dailyPuzzleDate }: WordleGameProps) => {
  const [solution] = useState(puzzle.solution_word.toUpperCase());
  const [wordLength] = useState(solution.length);
  const MAX_GUESSES = 6;
  console.log(solution);
  console.log(wordLength);

  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [currentRow, setCurrentRow] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [letterStatuses, setLetterStatuses] = useState<Record<string, KeyStatus>>({});
  const [gameResult, setGameResult] = useState<{
    score: number;
    submissionId: number | null;
    currentStreak: number;
    maxStreak: number;
    streakUpdatedToday: boolean;
    message: string;
  } | null>(null);

  const { time, startTimer, stopTimer, setSavedTime } = useTimer();
  const fetchSavedWordle = useCallback(
    () => getSavedAttempt('wordle', dailyPuzzleDate, puzzle.id),
    [dailyPuzzleDate, puzzle.id]
  );
  const { data: savedGame, loading } = useApi(fetchSavedWordle);



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
      saveProgress(
        {
          puzzle_id: puzzle.id,
          puzzle_type: 'wordle',
          progress_data: progress,
          time_spent_ms: time,
          difficulty,
        },
        dailyPuzzleDate,
        puzzle.id
      );
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [guesses, currentRow, /*letterStatuses,*/ isGameOver, time, loading, puzzle.id]); // Removed letterStatuses & gameResult

  // handleKeyPress callback
  const handleKeyPress = useCallback((key: string) => {
    if (isGameOver) return;

    if (key === 'Enter') {
      // --- Check against dynamic wordLength ---
      if (currentGuess.length === wordLength) {
        // Basic check if word is valid (replace with real dictionary check later)
        if (currentGuess.length !== wordLength) {
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

        // if (currentGuess === solution) {
        //   endGame(newRow, true);
        // } else if (newRow >= MAX_GUESSES) {
        //   endGame(MAX_GUESSES, false);
        // }
        if (currentGuess === solution) {
          endGame(newRow);
        } else if (newRow >= MAX_GUESSES) {
          endGame(MAX_GUESSES);
        }
      } else {
        console.warn(`Guess must be ${wordLength} letters`); // Use dynamic length
      }
    } else if (key === 'Backspace') {
      setCurrentGuess(g => g.slice(0, -1));
    } else if (currentGuess.length < wordLength && /^[a-zA-Z]$/.test(key)) { // Check against dynamic length
      setCurrentGuess(g => g + key.toUpperCase());
    }
  }, [isGameOver, currentGuess, guesses, currentRow, letterStatuses, solution, puzzle.id, MAX_GUESSES, wordLength]); // <-- Add wordLength
  // ---

  // endGame function
  const endGame = async (tries: number) => {
    if (isGameOver) return;
    setIsGameOver(true);
    stopTimer();
    const finalTime = time;
    let finalScore = 0;
    let submissionIdForResultModal: number | null = null;
    let submissionResult: SubmissionResult | null = null;

    try {
      const submissionData: SubmissionData = {
        puzzle_id: puzzle.id,
        puzzle_type: 'wordle',
        difficulty: difficulty, // <-- Pass difficulty
        time_taken_ms: finalTime,
        tries: tries,
      };

      submissionResult = await submitPuzzle(submissionData, dailyPuzzleDate, puzzle.id);
      finalScore = submissionResult.score;
      submissionIdForResultModal = submissionResult.submissionId ?? null;

      if (challengeId && submissionIdForResultModal) {
        console.log(`[WordleGame] Completing challenge ${challengeId} with submission ${submissionIdForResultModal}`);
        await completeChallenge(challengeId, { submission_id: submissionIdForResultModal });
        console.log(`[WordleGame] Challenge ${challengeId} marked as complete.`);
      } else if (challengeId) {
        console.error("[WordleGame] Challenge ID present but failed to get submission ID.");
      }
    } catch (err) {
      console.error("Error during game end:", err);
    } finally {
      setGameResult({
        score: finalScore,
        submissionId: submissionIdForResultModal,
        currentStreak: submissionResult?.currentStreak ?? 0,
        maxStreak: submissionResult?.maxStreak ?? 0,
        streakUpdatedToday: submissionResult?.streakUpdatedToday ?? false,
        message: submissionResult?.message ?? '',
      });
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

  // if (loading) {
  //   return <LoadingSpinner fullPage={true} />;
  // }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 items-center p-4">
      <div className="place-content-center p-20 text-xl leading-6 bg-white h-full rounded-3xl">
        <WordleGrid
          guesses={guesses}
          currentGuess={currentGuess}
          solution={solution}
          currentRow={currentRow}
          maxGuesses={MAX_GUESSES}
          wordLength={wordLength} // <-- Pass dynamic length
        />
      </div>
      <div className="place-content-center p-20 text-xl leading-5">
        <div className="flex justify-between mb-10">
          <div className="">
            <h1 className="text-4xl font-bold">Wordle</h1>
            <p>on {difficulty} difficulty</p>

          </div>
          <Timer timeMs={time} />
        </div>
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
