// /src/pages/gamePage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { getDailyPuzzles, checkSubmissionExists, getSavedAttempt } from '../api/gameService';
import { AlreadyPlayedScreen } from '../components/gameComponents/shared/alreadyPlayedScreen';
import { ResumeGameScreen } from '../components/gameComponents/shared/resumeGameScreen';
import { LoadingSpinner } from '../components/ui/loadingSpinner';
import GameIntro from '../components/features/games/gameIntro';

// Import your game components
import { WordleGame } from '../components/gameComponents/wordle/wordleGame';
import { SudokuGame } from '../components/gameComponents/sudoku/sudokuGame';
import { ErnigramGame } from '../components/gameComponents/ernigram/ernigramGame';

import type { PuzzleAttemptData, WordleProgress } from '../types';

// Define game intro content
const introContent = {
  wordle: {
    title: 'Wordle',
    description: 'Guess the hidden <strong>5-letter word</strong>.',
    howToPlay: `You have a set number of tries to guess the word.\nType a 5-letter word and press Enter.\nTiles change color to show how close your guess was:\n<strong class="text-emerald-500">Green</strong>: Correct letter, correct spot.\n<strong class="text-yellow-400">Yellow</strong>: Correct letter, wrong spot.\n<strong class="text-gray-600">Gray</strong>: Letter not in the word.`,
    pointsInfo: 'Earn points based on how many tries you take. Fewer tries = more points!',
    hintInfo: 'Hard mode gives you fewer tries!',
    color: 'bg-emerald-500',
    darkColor: 'shadow-emerald-900',
    bgColor: 'bg-emerald-100',
  },
  sudoku: {
    title: 'Sudoku',
    description: 'Fill the <strong>9x9 grid</strong> so each row, column, and 3x3 box contains digits 1-9 without repeating.',
    howToPlay: `Click a cell to select it.\nUse the number pad to enter digits.\nToggle "Note Mode" (<span class="inline-block align-middle mx-1">📝</span>) to pencil in possibilities.\nCells will turn <strong class="text-red-500">red</strong> if they conflict with another number.`,
    pointsInfo: 'Earn points based on how quickly you solve the puzzle.',
    hintInfo: 'Hard mode gives you fewer starting numbers.',
    color: 'bg-pink-400',
    darkColor: 'shadow-pink-800',
    bgColor: 'bg-pink-100',
  },
  ernigram: {
    title: 'ERNIgram',
    description: 'Guess the hidden phrase related to <strong>ERNI culture, values, or tools</strong>.',
    howToPlay: `Guess letters one by one using the keyboard.\nEach incorrect guess reduces your remaining attempts.\nTry to solve the phrase before you run out of guesses!`,
    pointsInfo: 'Earn points based on remaining attempts and time.',
    hintInfo: 'Hard mode gives you significantly fewer attempts!',
    color: 'bg-sky-400',
    darkColor: 'shadow-sky-800',
    bgColor: 'bg-sky-100',
  },
};

export type Difficulty = "easy" | "hard";

// --- Helper Function ---
// This checks if an attempt has actual progress
const hasResumableProgress = (attempt: PuzzleAttemptData | null, gameType: string) => {
  if (!attempt) return false;
  
  let hasProgress = attempt.time_spent_ms > 5000; // 5 seconds
  
  if (gameType === 'wordle') {
    const wordleProgress = attempt.progress_data as WordleProgress;
    hasProgress = hasProgress || (wordleProgress?.guesses?.length > 0 && !wordleProgress?.isGameOver);
  }
  // TODO: Add similar progress checks for Sudoku and Ernigram here
  
  return hasProgress;
};
// -----------------------


export const GamePage = () => {
  const { gameType } = useParams<{ gameType: string }>();
  
  // This is the user's *selected* difficulty, defaults to 'easy'
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  
  // This locks the difficulty if a game is found
  const [lockedDifficulty, setLockedDifficulty] = useState<Difficulty | null>(null);
  
  const [hasStarted, setHasStarted] = useState(false); 
  const { data: puzzles, loading: loadingPuzzles, error: error } = useApi(getDailyPuzzles);
  
  // State for the *found* submission or attempt
  const [foundSubmission, setFoundSubmission] = useState<any>(null);
  const [foundAttempt, setFoundAttempt] = useState<PuzzleAttemptData | null>(null);
  
  // Single loading state for both checks
  const [isChecking, setIsChecking] = useState(true);

  // Reset states when the gameType (URL) changes
  useEffect(() => {
    setHasStarted(false);
    setSelectedDifficulty('easy');
    setLockedDifficulty(null);
    setFoundSubmission(null);
    setFoundAttempt(null);
    setIsChecking(true);
  }, [gameType]);


  // --- Combined Check Effect ---
  // This runs on load and checks both difficulties
  useEffect(() => {
    // Wait for puzzles to be loaded
    if (loadingPuzzles || !puzzles || !gameType) {
      return;
    }

    // Don't re-check if user is playing
    if (hasStarted) {
      return;
    }

    setIsChecking(true);
    
    // Define the puzzles to check
    const puzzlesToCheck: { diff: Difficulty; puzzle: any }[] = [
      { diff: 'easy', puzzle: (puzzles as any)[`${gameType}_easy`] },
      { diff: 'hard', puzzle: (puzzles as any)[`${gameType}_hard`] },
    ];
    
    // Special case for Sudoku/Ernigram if they share one puzzle object
    if (gameType === 'sudoku' || gameType === 'ernigram') {
      puzzlesToCheck[0].puzzle = (puzzles as any)[gameType];
      puzzlesToCheck[1].puzzle = null; // Only check one
    }

    const checkAll = async () => {
      let submission = null;
      let attempt = null;
      let diffLock: Difficulty | null = null;

      for (const { diff, puzzle } of puzzlesToCheck) {
        if (!puzzle) continue;

        // 1. Check for submission
        const subResult = await checkSubmissionExists(gameType, puzzles.date, puzzle.id);
        if (subResult.hasSubmitted) {
          submission = subResult;
          diffLock = diff;
          break; // Found a submission, stop
        }

        // 2. Check for resumable attempt
        const attemptResult = await getSavedAttempt(gameType, puzzles.date, puzzle.id);
        if (hasResumableProgress(attemptResult, gameType)) {
          attempt = attemptResult;
          diffLock = diff;
          break; // Found an attempt, stop
        }
      }

      // Set results
      setFoundSubmission(submission);
      setFoundAttempt(attempt);
      setLockedDifficulty(diffLock);
    };
    
    checkAll().finally(() => setIsChecking(false));

  }, [loadingPuzzles, puzzles, gameType, hasStarted]); // Re-run if user goes "Back"

  
  // --- RENDER LOGIC ---

  const isLoading = loadingPuzzles || isChecking;
  
  // Get intro data (needed for colors, etc.)
  const isValidGameType = gameType && gameType in introContent;
  const introData = isValidGameType ? introContent[gameType as keyof typeof introContent] : null;

  // The *active* difficulty is the one we locked, or the one the user selected
  const activeDifficulty = lockedDifficulty || selectedDifficulty;
  
  // Get the puzzle data for the *active* difficulty
  const { puzzleData, GameComponent } = useMemo(() => {
    if (!puzzles || !isValidGameType) {
      return { puzzleData: null, GameComponent: null };
    }
    let pd: any = null;
    let gc: React.ComponentType<any> | null = null;
    
    switch (gameType) {
      case 'wordle':
        gc = WordleGame;
        pd = activeDifficulty === 'easy' ? puzzles.wordle_easy : puzzles.wordle_hard;
        break;
      case 'sudoku':
        gc = SudokuGame;
        pd = puzzles.sudoku;
        break;
      case 'ernigram':
        gc = ErnigramGame;
        pd = puzzles.ernigram;
        break;
      default:
        return { puzzleData: null, GameComponent: null };
    }
    return { puzzleData: pd, GameComponent: gc };
  }, [puzzles, isValidGameType, gameType, activeDifficulty]);

  // --- Render ---

  if (isLoading) {
    return <LoadingSpinner fullPage={true} />;
  }

  // Handle API error or invalid game type
  if (error || !puzzles || !isValidGameType || !introData) {
    if (error) {
      console.error("[GamePage] Error fetching puzzles:", error);
      return (
        <div className="p-8 text-center text-red-600">
          Could not load daily puzzles from the server. Please try again later.
          <p className="text-sm">{error.message}</p>
        </div>
      );
    }
    // Navigate home if game type is invalid
    return <Navigate to="/" replace />;
  }


// We now render content into a variable, which is cleaner
  let content;

  // RENDER PRIORITY 1: SUBMISSION FOUND
  if (foundSubmission) {
    content = (
      <AlreadyPlayedScreen
        gameType={gameType as any}
        score={foundSubmission.score || 0}
        submittedAt={foundSubmission.submittedAt || new Date().toISOString()}
        difficulty={lockedDifficulty!} 
      />
    );
  }
  // RENDER PRIORITY 2 OR 3: INTRO / RESUME
  else if (!hasStarted) {
    if (foundAttempt) {
      // ✅ 2. RENDER THE NEW RESUME SCREEN
      content = (
        <ResumeGameScreen
          gameType={gameType as any}
          guessCount={gameType === 'wordle' ? (foundAttempt.progress_data as WordleProgress)?.guesses?.length || 0 : 0}
          maxGuesses={6} // TODO: make dynamic
          puzzleDate={puzzles!.date} // We know puzzles exists here
          puzzleNumber={puzzleData.id} 
          onContinue={() => {
            setHasStarted(true); // Go to game
          }}
          difficulty={activeDifficulty}
        />
      );
    } else {
      // No attempt found, show the intro
      content = (
        <GameIntro
          title={introData!.title}
          description={introData!.description}
          howToPlay={introData!.howToPlay}
          pointsInfo={introData!.pointsInfo}
          hintInfo={introData!.hintInfo}
          onStart={() => setHasStarted(true)}
          onDifficultyChange={setSelectedDifficulty}
          initialDifficulty={activeDifficulty} 
          // disableDifficulty={lockedDifficulty !== null} 
          color={introData.color}
          darkColor={introData.darkColor}
        />
      );
    }
  }
  // RENDER PRIORITY 4: PLAYING GAME
  else {
    if (!puzzleData || !GameComponent) {
      // "Puzzle Not Available" logic
      content = (
        <div className="text-center p-8 bg-white/50 rounded-lg">
          <h2 className="text-2xl font-bold text-red-600">Puzzle Not Available</h2>
          <p className="text-gray-700 mt-2">
            The {introData!.title} puzzle for '{activeDifficulty}' mode has not been set by the admin for today.
          </p>
          <button
            onClick={() => setHasStarted(false)} // Go back to intro
            className="mt-6 px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow"
          >
            Go Back
          </button>
        </div>
      );
    } else {
      // All checks passed, show the game
      content = (
        <GameComponent
          puzzle={puzzleData}
          difficulty={activeDifficulty}
          challengeId={null}
          dailyPuzzleDate={puzzles!.date}
        />
      );
    }
  }

  // The final render is now just this one container
  return (
    <div className={`container mx-auto h-full w-full shadow-md rounded-4xl p-4 sm:p-8 md:p-12 ${introData!.bgColor}`}>
      {content}
    </div>
  );
}