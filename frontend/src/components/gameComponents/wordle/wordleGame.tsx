// src/components/gameComponents/wordle/wordleGame.tsx - WITHOUT RESUME MODAL

import { useState, useEffect, useCallback, useRef } from 'react';
import { submitPuzzle, getSavedAttempt, saveProgress, checkSubmissionExists } from '../../../api/gameService';
import { completeChallenge } from '../../../api/challengeService';
import type { WordlePuzzle, SubmissionData, PuzzleAttemptData, WordleProgress, KeyStatus } from '../../../types/game';
import { WordleGrid } from './wordleGrid';
import { Keyboard } from './keyboard';
import { PostGameResultsModal } from '../../ui/postGameResultsModal';
import { AlreadyPlayedScreen } from '../shared/alreadyPlayedScreen';
// ❌ REMOVED: ResumeGameModal import
import { useTimer } from '../../../hooks/useTimer';
import { Timer } from '../../ui/timer';
import { useApi } from '../../../hooks/useApi';
import { LoadingSpinner } from '../../ui/loadingSpinner';
import type { Difficulty } from '../../../pages/gamePage';

interface WordleGameProps {
  puzzle: WordlePuzzle;
  difficulty: Difficulty;
  challengeId: number | null;
}

export const WordleGame = ({ puzzle, difficulty, challengeId }: WordleGameProps) => {
  const [solution] = useState(puzzle.solution_word.toUpperCase());
  const [wordLength] = useState(solution.length);
  const MAX_GUESSES = 6;

  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [currentRow, setCurrentRow] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [letterStatuses, setLetterStatuses] = useState<Record<string, KeyStatus>>({});
  const [gameResult, setGameResult] = useState<{ score: number; submissionId: number | null } | null>(null);
  
  // ❌ REMOVED: showResumeModal state
  
  const [alreadyCompleted, setAlreadyCompleted] = useState<{
    hasSubmitted: boolean;
    score?: number;
    submittedAt?: string;
  } | null>(null);
  const [checkingSubmission, setCheckingSubmission] = useState(true);

  const { time, startTimer, stopTimer, setSavedTime } = useTimer();

  const guessesRef = useRef<string[]>([]);
  useEffect(() => {
    guessesRef.current = guesses;
  }, [guesses]);

  // Check for existing submission FIRST
  useEffect(() => {
    if (!puzzle?.date_to_be_used || !puzzle?.id) {
      setCheckingSubmission(false);
      return;
    }
    
    console.log('[WordleGame] Checking if already submitted...');
    setCheckingSubmission(true);
    
    checkSubmissionExists('wordle', puzzle.date_to_be_used, puzzle.id)
      .then(result => {
        console.log('[WordleGame] Submission check result:', result);
        if (result.hasSubmitted) {
          setAlreadyCompleted(result);
          setIsGameOver(true);
        }
      })
      .catch(err => console.error('[WordleGame] Check failed:', err))
      .finally(() => setCheckingSubmission(false));
  }, [puzzle?.date_to_be_used, puzzle?.id]);

  // Fetch saved game
  const fetchSavedWordle = useCallback(() => {
    if (!puzzle?.date_to_be_used || !puzzle?.id || alreadyCompleted?.hasSubmitted) {
      return Promise.resolve(null);
    }
    return getSavedAttempt('wordle', puzzle.date_to_be_used, puzzle.id.toString());
  }, [puzzle?.date_to_be_used, puzzle?.id, alreadyCompleted]);

  const { data: savedGame, loading } = useApi(fetchSavedWordle);

  // ✅ UPDATED: Load saved progress and START timer
  useEffect(() => {
    if (alreadyCompleted?.hasSubmitted) return;
    
    let loadedIsGameOver = false;
    if (savedGame && savedGame.puzzle_type === 'wordle') {
      const progress = savedGame.progress_data as WordleProgress;
      setGuesses(progress.guesses || []);
      setCurrentRow(progress.currentRow || 0);
      setLetterStatuses(progress.letterStatuses || {});
      setIsGameOver(progress.isGameOver || false);
      setSavedTime(savedGame.time_spent_ms);
      loadedIsGameOver = progress.isGameOver;
      console.log('[WordleGame] Saved data loaded.');
    }
    
    // Start the timer *unless* the loaded game was already over
    if (!loadedIsGameOver) {
      console.log('[WordleGame] Starting timer.');
      startTimer();
    }
  }, [savedGame, startTimer, setSavedTime, alreadyCompleted]);

  // Auto-save progress (no changes here)
  useEffect(() => {
    if (loading || isGameOver || alreadyCompleted?.hasSubmitted || !puzzle?.date_to_be_used || !puzzle?.id || !difficulty) return;

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
  }, [guesses, currentRow, isGameOver, time, loading, puzzle?.id, puzzle?.date_to_be_used, difficulty, letterStatuses, alreadyCompleted]);

  // endGame function (no changes here)
  const endGame = useCallback(async (
    tries: number, 
    won: boolean, 
    currentGuessesArray: string[],
    currentLetterStatuses: Record<string, KeyStatus>
  ) => {
    if (isGameOver || alreadyCompleted?.hasSubmitted) return;
    
    setIsGameOver(true);
    stopTimer();
    const finalTime = time;
    let finalScore = 0;
    let submissionIdForResultModal: number | null = null;

    if (!puzzle?.date_to_be_used || !puzzle?.id) {
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
      console.error("[WordleGame] Error:", err);
    } finally {
      setGameResult({ score: finalScore, submissionId: submissionIdForResultModal });
    }
  }, [isGameOver, stopTimer, time, puzzle, difficulty, challengeId, alreadyCompleted]);

  // handleKeyPress function (no changes here)
  const handleKeyPress = useCallback((key: string) => {
    if (isGameOver || alreadyCompleted?.hasSubmitted) return;

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

        // CRITICAL FIX: Save immediately after guess is made
        if (puzzle?.date_to_be_used && puzzle?.id && difficulty) {
          const progress: WordleProgress = { 
            guesses: newGuesses, 
            currentRow: newRow, 
            letterStatuses: newStatuses, 
            isGameOver: false, 
            status: 'ACTIVE' 
          };
          
          const dataPayload: PuzzleAttemptData = {
            puzzle_id: puzzle.id,
            puzzle_type: 'wordle',
            progress_data: progress,
            time_spent_ms: time,
            difficulty: difficulty,
          };

          console.log('[WordleGame] Saving guess immediately:', newGuesses);
          saveProgress(dataPayload, puzzle.date_to_be_used, puzzle.id)
            .then(() => console.log('[WordleGame] Guess saved successfully'))
            .catch(err => console.error('[WordleGame] Failed to save guess:', err));
        }

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
  }, [isGameOver, currentGuess, guesses, currentRow, letterStatuses, solution, wordLength, endGame, MAX_GUESSES, alreadyCompleted, puzzle, difficulty, time]);

  // keydown listener (no changes here)
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

  // ❌ REMOVED: handleContinue function

  // Loading spinner (no changes here)
  if (checkingSubmission || loading) {
    return <LoadingSpinner fullPage={true} />;
  }

  // Already played screen (no changes here)
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

  // --- Render ---
  return (
    <>
      {/* ❌ REMOVED: Resume Modal JSX */}

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