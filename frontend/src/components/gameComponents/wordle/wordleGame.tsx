import { useState, useEffect, useCallback, useRef } from 'react';
import { submitPuzzle, getSavedAttempt, saveProgress, checkSubmissionExists } from '../../../api/gameService';
import { completeChallenge } from '../../../api/challengeService';
import type { WordlePuzzle, SubmissionData, PuzzleAttemptData, WordleProgress, KeyStatus } from '../../../types/game';
import { WordleGrid } from './wordleGrid';
import { Keyboard } from './keyboard';
import { PostGameResultsModal } from '../../ui/postGameResultsModal';
import { useTimer } from '../../../hooks/useTimer';
import { Timer } from '../../ui/timer';
import { useApi } from '../../../hooks/useApi';
import { LoadingSpinner } from '../../ui/loadingSpinner';
import type { Difficulty } from '../../../pages/gamePage';
import { Trophy, Star } from 'lucide-react';


interface WordleGameProps {
  puzzle: WordlePuzzle;
  difficulty: Difficulty;
  challengeId: number | null;
}

export const WordleGame = ({ puzzle, difficulty, challengeId }: WordleGameProps) => {
  const [solution] = useState(puzzle.solution_word.toUpperCase());
  const [wordLength] = useState(solution.length);
  const MAX_GUESSES = 6;

  console.log('[WordleGame] Solution:', solution);

  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [currentRow, setCurrentRow] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [letterStatuses, setLetterStatuses] = useState<Record<string, KeyStatus>>({});
  const [gameResult, setGameResult] = useState<{ score: number; submissionId: number | null } | null>(null);

  const { time, startTimer, stopTimer, setSavedTime } = useTimer();

  // ✅ Track guesses in ref
  const guessesRef = useRef<string[]>([]);
  useEffect(() => {
    guessesRef.current = guesses;
  }, [guesses]);

  const fetchSavedWordle = useCallback(() => {
    if (!puzzle?.date_to_be_used || !puzzle?.id) {
      console.warn('[WordleGame] Missing puzzle date or ID');
      return Promise.resolve(null);
    }
    return getSavedAttempt('wordle', puzzle.date_to_be_used, puzzle.id.toString());
  }, [puzzle?.date_to_be_used, puzzle?.id]);

  const { data: savedGame, loading } = useApi(fetchSavedWordle);

  // ✅ NEW: Replay prevention state
   const [alreadyCompleted, setAlreadyCompleted] = useState<{
    hasSubmitted: boolean;
    score?: number;
  } | null>(null);

  // ✅ Check if already completed on mount
  useEffect(() => {
    if (!puzzle?.date_to_be_used || !puzzle?.id) return;
    
    checkSubmissionExists('wordle', puzzle.date_to_be_used, puzzle.id)
      .then(result => {
        if (result.hasSubmitted) {
          setAlreadyCompleted(result);
          setIsGameOver(true);
          console.log('[WordleGame] Already completed with score:', result.score);
        }
      })
      .catch(err => console.error('[WordleGame] Check failed:', err));
  }, [puzzle?.date_to_be_used, puzzle?.id]);

  // ✅ If already completed, show locked UI
  if (alreadyCompleted?.hasSubmitted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 items-center p-4">
        <div className="place-content-center p-20 text-xl leading-6 bg-white h-full rounded-3xl">
          <WordleGrid
            guesses={guesses}
            currentGuess=""
            solution={solution}
            currentRow={currentRow}
            maxGuesses={MAX_GUESSES}
            wordLength={wordLength}
          />
        </div>
        <div className="place-content-center p-20 text-xl leading-5">
          <div className="text-center">
            <Trophy className="mx-auto text-yellow-500 mb-4" size={64} />
            <h2 className="text-2xl font-bold mb-2">Already Completed!</h2>
            <p className="text-gray-600 mb-4">
              You've already finished today's Wordle puzzle.
            </p>
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600">Your Score:</p>
              <div className="flex items-center justify-center gap-2 text-3xl font-bold text-primary">
                {alreadyCompleted.score}
                <Star size={28} className="text-yellow-500 fill-current" />
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 🧩 Continue original logic only if puzzle not yet completed
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

  useEffect(() => {
    if (loading || isGameOver || !puzzle?.date_to_be_used || !puzzle?.id || !difficulty) return;

    const saveTimer = setTimeout(() => {
      const progress: WordleProgress = { 
        guesses, 
        currentRow, 
        letterStatuses, 
        isGameOver, 
        status: isGameOver ? 'SOLVED' : 'ACTIVE' 
      };
      
      const dataPayload: PuzzleAttemptData = {
        puzzle_id: puzzle.id,
        puzzle_type: 'wordle',
        progress_data: progress,
        time_spent_ms: time,
        difficulty: difficulty,
      };

      saveProgress(dataPayload, puzzle.date_to_be_used, puzzle.id)
        .catch(err => console.error('[WordleGame] Save failed:', err));
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [guesses, currentRow, isGameOver, time, loading, puzzle?.id, puzzle?.date_to_be_used, difficulty, letterStatuses]);

  // 🧩 endGame (unchanged)
  const endGame = useCallback(async (
    tries: number, 
    won: boolean, 
    currentGuessesArray: string[],
    currentLetterStatuses: Record<string, KeyStatus>
  ) => {
    console.log('[WordleGame] ========== GAME END START ==========');
    if (isGameOver) return;

    setIsGameOver(true);
    stopTimer();
    const finalTime = time;
    let finalScore = 0;
    let submissionIdForResultModal: number | null = null;

    if (!puzzle?.date_to_be_used || !puzzle?.id) {
      console.error('[WordleGame] Missing puzzle date or ID');
      setGameResult({ score: 0, submissionId: null });
      return;
    }

    if (!won) {
      setGameResult({ score: 0, submissionId: null });
      return;
    }

    try {
      const finalProgress: WordleProgress = {
        guesses: currentGuessesArray,
        currentRow: tries,
        letterStatuses: currentLetterStatuses,
        isGameOver: true,
        status: 'SOLVED'
      };

      await saveProgress(
        {
          puzzle_id: puzzle.id,
          puzzle_type: 'wordle',
          progress_data: finalProgress,
          time_spent_ms: finalTime,
          difficulty: difficulty,
        },
        puzzle.date_to_be_used,
        puzzle.id
      );

      await new Promise(resolve => setTimeout(resolve, 500));

      const submissionData: SubmissionData = {
        puzzle_id: puzzle.id,
        puzzle_type: 'wordle',
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

      if (challengeId && submissionIdForResultModal) {
        await completeChallenge(challengeId, { submission_id: submissionIdForResultModal });
      }
    } catch (err) {
      console.error("[WordleGame] ❌ Error:", err);
    } finally {
      setGameResult({ score: finalScore, submissionId: submissionIdForResultModal });
      console.log('[WordleGame] ========== GAME END COMPLETE ==========');
    }
  }, [isGameOver, stopTimer, time, puzzle, difficulty, challengeId]);

  // 🧩 handleKeyPress (unchanged)
  const handleKeyPress = useCallback((key: string) => {
    if (isGameOver) return;

    if (key === 'Enter') {
      if (currentGuess.length === wordLength) {
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
          setTimeout(() => endGame(newRow, true, newGuesses, newStatuses), 100);
        } else if (newRow >= MAX_GUESSES) {
          setTimeout(() => endGame(MAX_GUESSES, false, newGuesses, newStatuses), 100);
        }
      }
    } else if (key === 'Backspace') {
      setCurrentGuess(g => g.slice(0, -1));
    } else if (currentGuess.length < wordLength && /^[a-zA-Z]$/.test(key)) {
      setCurrentGuess(g => g + key.toUpperCase());
    }
  }, [isGameOver, currentGuess, guesses, currentRow, letterStatuses, solution, wordLength, endGame, MAX_GUESSES]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Backspace') {
        handleKeyPress(e.key);
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  return (
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
      </div>
      <div className="place-content-center p-20 text-xl leading-5">
        <div className="flex justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold">Wordle</h1>
            <p>on {difficulty} difficulty</p>
          </div>
          <Timer timeMs={time} />
        </div>
        <div className={isGameOver ? 'opacity-50 pointer-events-none' : ''}>
          <Keyboard onKeyPress={handleKeyPress} letterStatuses={letterStatuses} />
        </div>

      {gameResult && (
        <PostGameResultsModal
          score={gameResult.score}
          submissionId={gameResult.submissionId}
          gameType="wordle" // ✅ ADD THIS LINE
          onClose={() => setGameResult(null)}
        />
)}
      </div>
    </div>
  );
};
