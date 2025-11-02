// src/components/gameComponents/wordle/wordleGame.tsx - CRITICAL UPDATES

import { useState, useEffect, useCallback, useRef } from 'react';
import { submitPuzzle, getSavedAttempt, saveProgress, checkSubmissionExists } from '../../../api/gameService';
import { completeChallenge } from '../../../api/challengeService';
import type { WordlePuzzle, SubmissionData, PuzzleAttemptData, WordleProgress, KeyStatus } from '../../../types/game';
import { WordleGrid } from './wordleGrid';
import { Keyboard } from './keyboard';
import { PostGameResultsModal } from '../../ui/postGameResultsModal';
import { AlreadyPlayedScreen } from '../shared/alreadyPlayedScreen'; // ✅ NEW IMPORT
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
  
  // ✅ NEW: Track if already completed
  const [alreadyCompleted, setAlreadyCompleted] = useState<{
    hasSubmitted: boolean;
    score?: number;
    submittedAt?: string;
  } | null>(null);
  const [checkingSubmission, setCheckingSubmission] = useState(true); // ✅ NEW: Loading state

  const { time, startTimer, stopTimer, setSavedTime } = useTimer();

  const guessesRef = useRef<string[]>([]);
  useEffect(() => {
    guessesRef.current = guesses;
  }, [guesses]);

  // ✅ CRITICAL: Check for existing submission FIRST (before loading saved game)
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

  // Fetch saved game (only if not already completed)
  const fetchSavedWordle = useCallback(() => {
    if (!puzzle?.date_to_be_used || !puzzle?.id || alreadyCompleted?.hasSubmitted) {
      return Promise.resolve(null);
    }
    return getSavedAttempt('wordle', puzzle.date_to_be_used, puzzle.id.toString());
  }, [puzzle?.date_to_be_used, puzzle?.id, alreadyCompleted]);

  const { data: savedGame, loading } = useApi(fetchSavedWordle);

  // Load saved progress
  useEffect(() => {
    if (alreadyCompleted?.hasSubmitted) return; // Don't load if already completed
    
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
  }, [savedGame, startTimer, setSavedTime, alreadyCompleted]);

  // Auto-save progress
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

  const endGame = useCallback(async (
    tries: number, 
    won: boolean, 
    currentGuessesArray: string[],
    currentLetterStatuses: Record<string, KeyStatus>
  ) => {
    if (isGameOver || alreadyCompleted?.hasSubmitted) return; // ✅ Block if already completed
    
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

  const handleKeyPress = useCallback((key: string) => {
    if (isGameOver || alreadyCompleted?.hasSubmitted) return; // ✅ Block input if completed

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
  }, [isGameOver, currentGuess, guesses, currentRow, letterStatuses, solution, wordLength, endGame, MAX_GUESSES, alreadyCompleted]);

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

  // ✅ SHOW LOADING STATE WHILE CHECKING
  if (checkingSubmission || loading) {
    return <LoadingSpinner fullPage={true} />;
  }

  // ✅ SHOW "ALREADY PLAYED" SCREEN IF COMPLETED
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

  // ✅ NORMAL GAME RENDER
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
  );
};