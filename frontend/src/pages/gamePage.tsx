// frontend/src/pages/gamePage.tsx - COMPLETE FILE WITH DIFFICULTY FIX
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Navigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { getDailyPuzzles, checkSubmissionExists, getSavedAttempt } from '../api/gameService';
import { AlreadyPlayedScreen } from '../components/gameComponents/shared/alreadyPlayedScreen';
import { ResumeGameScreen } from '../components/gameComponents/shared/resumeGameScreen';
import { LoadingSpinner } from '../components/ui/loadingSpinner';
import GameIntro from '../components/features/games/gameIntro';
import { CircleQuestionMark, Star } from 'lucide-react';
import { InstructionsModal } from '../components/features/games/instructionsModal';
// Import your game components
import { WordleGame } from '../components/gameComponents/wordle/wordleGame';
import { SudokuGame } from '../components/gameComponents/sudoku/sudokuGame';
import { ErnigramGame } from '../components/gameComponents/ernigram/ernigramGame';

import type { PuzzleAttemptData, WordleProgress } from '../types';
import { PointsComputationModal } from '../components/features/games/pointsComputationModal';

// Define game intro content
const introContent = {
  wordle: {
    title: 'Wordle',
    description: 'Guess the hidden <strong>5-letter word</strong>.',
    howToPlay: `You have a set number of tries to guess the word.\nType a 5-letter word and press Enter.\nTiles change color to show how close your guess was:\n<strong class="text-emerald-500">Green</strong>: Correct letter, correct spot.\n<strong class="text-yellow-400">Yellow</strong>: Correct letter, wrong spot.\n<strong class="text-gray-600">Gray</strong>: Letter not in the word.`,
    pointsInfo: 'Earn points based on how many tries you take. Fewer tries = more points!',
    pointsCalculation: 'Points are all about how well (and how fast!) you play. You’ll get [base points] for every correct answer or completed round. On top of that, [bonus points] are added for things like quick responses, perfect streaks, and tougher challenges. Some games even throw in [extra multipliers] or [special bonuses] to keep things exciting. Play smart, play fast — and watch your score climb up the leaderboard!',
    hintInfo: 'Hard mode gives you fewer tries!',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-900',
    darkColor: 'shadow-emerald-900',
    bgColor: 'bg-emerald-100',
  },
  sudoku: {
    title: 'Sudoku',
    description: 'Fill the <strong>9x9 grid</strong> so each row, column, and 3x3 box contains digits 1-9 without repeating.',
    howToPlay: `Click a cell to select it.\nUse the number pad to enter digits.\nToggle "Note Mode" (<span class="inline-block align-middle mx-1">📝</span>) to pencil in possibilities.\nCells will turn <strong class="text-red-500">red</strong> if they conflict with another number.`,
    pointsInfo: 'Earn points based on how quickly you solve the puzzle.',
    pointsCalculation: 'Points are all about how well (and how fast!) you play. You’ll get [base points] for every correct answer or completed round. On top of that, [bonus points] are added for things like quick responses, perfect streaks, and tougher challenges. Some games even throw in [extra multipliers] or [special bonuses] to keep things exciting. Play smart, play fast — and watch your score climb up the leaderboard!',
    hintInfo: 'Hard mode gives you fewer starting numbers.',
    color: 'bg-pink-400',
    textColor: 'text-pink-800',
    darkColor: 'shadow-pink-800',
    bgColor: 'bg-pink-100',
  },
  ernigram: {
    title: 'ERNIgram',
    description: 'Guess the hidden phrase related to <strong>ERNI culture, values, or tools</strong>.',
    howToPlay: `Guess letters one by one using the keyboard.\nEach incorrect guess reduces your remaining attempts.\nTry to solve the phrase before you run out of guesses!`,
    pointsInfo: 'Earn points based on remaining attempts and time.',
    pointsCalculation: 'Points are all about how well (and how fast!) you play. You’ll get [base points] for every correct answer or completed round. On top of that, [bonus points] are added for things like quick responses, perfect streaks, and tougher challenges. Some games even throw in [extra multipliers] or [special bonuses] to keep things exciting. Play smart, play fast — and watch your score climb up the leaderboard!',
    hintInfo: 'Hard mode gives you significantly fewer attempts!',
    color: 'bg-sky-400',
    textColor: 'text-sky-800',
    darkColor: 'shadow-sky-800',
    bgColor: 'bg-sky-100',
  },
};

export type Difficulty = "easy" | "hard";

// --- Helper Function ---
const hasResumableProgress = (attempt: PuzzleAttemptData | null, gameType: string) => {
  if (!attempt) return false;

  // Base check: some time spent
  let hasProgress = attempt.time_spent_ms > 5000; // 5 seconds

  switch (gameType) {
    case 'wordle': {
      const wordleProgress = attempt.progress_data as WordleProgress;
      hasProgress =
        hasProgress ||
        (!!wordleProgress?.guesses?.length && !wordleProgress?.isGameOver);
      break;
    }

    case 'sudoku': {
      const sudokuProgress = attempt.progress_data as any; // define a SudokuProgress type if you have one
      // Resume if at least one cell is filled
      hasProgress =
        hasProgress ||
        (!!sudokuProgress?.filledCells?.length && !sudokuProgress?.isCompleted);
      break;
    }

    case 'ernigram': {
      const ernigramProgress = attempt.progress_data as any; // define a ErnigramProgress type if you have one
      // Resume if at least one letter has been guessed and game not over
      hasProgress =
        hasProgress ||
        (!!ernigramProgress?.guessedLetters?.length && !ernigramProgress?.isGameOver);
      break;
    }

    default:
      // For unknown games, fallback to time spent only
      break;
  }

  return hasProgress;
};

export const GamePage = () => {
  const { gameType } = useParams<{ gameType: string }>();
  const [searchParams] = useSearchParams();
  
  // ✅ CHALLENGE MODE: Get challengeId and difficulty from URL
  const challengeIdFromUrl = searchParams.get('challenge_id');
  const difficultyFromUrl = searchParams.get('difficulty')?.toLowerCase() as Difficulty | null;
  
  console.log('[GamePage] ========== URL PARAMS ==========');
  console.log('[GamePage] Full URL:', window.location.href);
  console.log('[GamePage] searchParams.toString():', searchParams.toString());
  console.log('[GamePage] challengeIdFromUrl:', challengeIdFromUrl);
  console.log('[GamePage] difficultyFromUrl:', difficultyFromUrl);
  
  const challengeId = challengeIdFromUrl ? parseInt(challengeIdFromUrl, 10) : null;
  
  console.log('[GamePage] Parsed challengeId:', challengeId);
  console.log('[GamePage] challengeId is null?:', challengeId === null);
  console.log('[GamePage] =====================================');
  
  // ✅ If challenge mode, use difficulty from URL, otherwise default to 'easy'
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(
    difficultyFromUrl || 'easy'
  );
  const [lockedDifficulty, setLockedDifficulty] = useState<Difficulty | null>(
    difficultyFromUrl || null
  );

  const [showInstructions, setShowInstructions] = useState(false);
  const [showPointsComputation, setShowPointsComputation] = useState(false);
  const [hasStarted, setHasStarted] = useState(false); 
  const { data: puzzles, loading: loadingPuzzles, error: error } = useApi(getDailyPuzzles);
  
  const [foundSubmission, setFoundSubmission] = useState<any>(null);
  const [foundAttempt, setFoundAttempt] = useState<PuzzleAttemptData | null>(null);
  
  const [isChecking, setIsChecking] = useState(true);
  const [checkError, setCheckError] = useState<string | null>(null);

  // ✅ CHALLENGE MODE: If challengeId exists, skip intro and start game immediately
  useEffect(() => {
    if (challengeId && difficultyFromUrl) {
      console.log('[GamePage] Challenge mode detected - skipping intro');
      console.log('[GamePage] Locking difficulty to:', difficultyFromUrl);
      setSelectedDifficulty(difficultyFromUrl);
      setLockedDifficulty(difficultyFromUrl);
      setHasStarted(true);
    }
  }, [challengeId, difficultyFromUrl]);

  // Reset states when the gameType (URL) changes
  useEffect(() => {
    if (!challengeId) {
      setHasStarted(false);
      setSelectedDifficulty('easy');
      setLockedDifficulty(null);
    } else {
      if (difficultyFromUrl) {
        setSelectedDifficulty(difficultyFromUrl);
        setLockedDifficulty(difficultyFromUrl);
      }
    }
    setFoundSubmission(null);
    setFoundAttempt(null);
    setIsChecking(true);
    setCheckError(null);
  }, [gameType, challengeId, difficultyFromUrl]);

  // --- Combined Check Effect ---
  useEffect(() => {
    if (loadingPuzzles || !puzzles || !gameType) {
      return;
    }

    if (hasStarted && !challengeId) {
      return;
    }

    setIsChecking(true);
    
    const puzzlesToCheck: { diff: Difficulty; puzzle: any }[] = [
      { diff: 'easy', puzzle: (puzzles as any)[`${gameType}_easy`] },
      { diff: 'hard', puzzle: (puzzles as any)[`${gameType}_hard`] },
    ];
    
    if (gameType === 'sudoku' || gameType === 'ernigram') {
      puzzlesToCheck[0].puzzle = (puzzles as any)[gameType];
      puzzlesToCheck[1].puzzle = null;
    }

    const checkAll = async () => {
      let submission = null;
      let attempt = null;
      let diffLock: Difficulty | null = null;

      try {
        for (const { diff, puzzle } of puzzlesToCheck) {
          if (!puzzle) continue;

          console.log(`[GamePage] Checking ${diff} difficulty for ${gameType}`);

          try {
            const subResult = await checkSubmissionExists(gameType, puzzles.date, puzzle.id);
            console.log(`[GamePage] Submission check result for ${diff}:`, subResult);
            
            if (subResult && subResult.hasSubmitted) {
              submission = subResult;
              diffLock = diff;
              console.log(`[GamePage] ✅ Found submission for ${diff}`);
              break;
            }
          } catch (err) {
            console.warn(`[GamePage] Submission check failed for ${diff}:`, err);
          }

          try {
            const attemptResult = await getSavedAttempt(gameType, puzzles.date, puzzle.id);
            console.log(`[GamePage] Attempt check result for ${diff}:`, attemptResult);
            
            if (attemptResult && hasResumableProgress(attemptResult, gameType)) {
              attempt = attemptResult;
              diffLock = diff;
              console.log(`[GamePage] ✅ Found resumable attempt for ${diff}`);
              break;
            }
          } catch (err) {
            console.log(`[GamePage] No attempt found for ${diff} (expected)`);
          }
        }

        setFoundSubmission(submission);
        setFoundAttempt(attempt);
        
        if (!challengeId) {
          setLockedDifficulty(diffLock);
        }
        
        setCheckError(null);
        
        console.log('[GamePage] ✅ Check complete:', {
          foundSubmission: !!submission,
          foundAttempt: !!attempt,
          lockedDifficulty: challengeId ? difficultyFromUrl : diffLock
        });
      } catch (err) {
        console.error('[GamePage] Critical error during checks:', err);
        setCheckError(err instanceof Error ? err.message : 'Failed to check game status');
      }
    };
    
    checkAll().finally(() => {
      setIsChecking(false);
      console.log('[GamePage] isChecking set to false');
    });

  }, [loadingPuzzles, puzzles, gameType, hasStarted, challengeId, difficultyFromUrl]);

  // --- RENDER LOGIC ---
  const isLoading = loadingPuzzles || isChecking;
  
  const isValidGameType = gameType && gameType in introContent;
  const introData = isValidGameType ? introContent[gameType as keyof typeof introContent] : null;

  const activeDifficulty = lockedDifficulty || selectedDifficulty;
  
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
    return <Navigate to="/" replace />;
  }

  if (checkError) {
    console.error("[GamePage] Check error (non-fatal):", checkError);
  }

  let content;

  // RENDER PRIORITY 1: SUBMISSION FOUND
  // ✅ CRITICAL FIX: Use difficulty from foundSubmission
  if (foundSubmission) {
    content = (
      <AlreadyPlayedScreen
        gameType={gameType as any}
        score={foundSubmission.score || 0}
        submittedAt={foundSubmission.submittedAt || new Date().toISOString()}
        difficulty={(foundSubmission.difficulty as Difficulty) || activeDifficulty}
      />
    );
  }
  // RENDER PRIORITY 2 OR 3: INTRO / RESUME
  else if (!hasStarted) {
    if (foundAttempt) {
      content = (
        <ResumeGameScreen
          gameType={gameType as any}
          guessCount={gameType === 'wordle' ? (foundAttempt.progress_data as WordleProgress)?.guesses?.length || 0 : 0}
          maxGuesses={6}
          puzzleDate={puzzles.date} 
          puzzleNumber={puzzleData?.id || 0} 
          onContinue={() => {
            setHasStarted(true);
          }}
          difficulty={activeDifficulty}
        />
      );
    } else {
      content = (
        <>
          <GameIntro
            title={introData.title}
            description={introData.description}
            howToPlay={introData.howToPlay}
            pointsInfo={introData.pointsInfo}
            hintInfo={introData.hintInfo}
            onStart={() => setHasStarted(true)}
            onDifficultyChange={setSelectedDifficulty}
            initialDifficulty={activeDifficulty}
            disableDifficultyChange={!!challengeId}
            color={introData.color}
            darkColor={introData.darkColor}
          >
            {/* This button is passed as a child and rendered by GameIntro on mobile */}
            <button
              onClick={() => setShowInstructions(true)}
              className={`font-semibold text-primary text-xl leading-none px-4 py-4 rounded-full ${introData.color} ${introData.darkColor} text-white shadow-[0_5px_0_0] hover:shadow-[0_3px_0_0] active:shadow-[0_1px_0_0] hover:translate-y-1 active:translate-y-2 transition-all`}
            >
              <CircleQuestionMark size={30} strokeWidth={2.5}/>
            </button>
            <button
              onClick={() => setShowPointsComputation(true)}
              className={`font-semibold text-primary text-xl leading-none px-4 ms-4 py-4 rounded-full ${introData.color} ${introData.darkColor} text-white shadow-[0_5px_0_0] hover:shadow-[0_3px_0_0] active:shadow-[0_1px_0_0] hover:translate-y-1 active:translate-y-2 transition-all`}
            >
              <Star size={30} strokeWidth={2.5}/>
            </button>
          </GameIntro>
          
          {/* Conditionally render the modal */}
          {showInstructions && (
            <InstructionsModal
              title={introData.title}
              description={introData.description}
              howToPlay={introData.howToPlay}
              onClose={() => setShowInstructions(false)}
            />
          )}

          {showPointsComputation && (
            <PointsComputationModal
              title={introData.title}
              computation={introData.pointsCalculation}
              onClose={() => setShowPointsComputation(false)}
            />
          )}
        </>
      );
    }
  }
  // RENDER PRIORITY 4: PLAYING GAME
  else {
    if (!puzzleData || !GameComponent) {
      content = (
        <div className="text-center p-8 bg-white/50 rounded-lg">
          <h2 className="text-2xl font-bold text-red-600">Puzzle Not Available</h2>
          <p className="text-gray-700 mt-2">
            The {introData.title} puzzle for '{activeDifficulty}' mode has not been set by the admin for today.
          </p>
          <button
            onClick={() => setHasStarted(false)}
            className="mt-6 px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow"
          >
            Go Back
          </button>
        </div>
      );
    } else {
      console.log('[GamePage] ========== RENDERING GAME ==========');
      console.log('[GamePage] gameType:', gameType);
      console.log('[GamePage] About to pass challengeId:', challengeId);
      console.log('[GamePage] difficulty:', activeDifficulty);
      console.log('[GamePage] =====================================');
      
      content = (
        <>
          {challengeId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-center">
              <p className="text-blue-800 font-medium">
                🎯 Challenge Mode - Playing on <span className="uppercase font-bold">{activeDifficulty}</span> difficulty
              </p>
              <p className="text-blue-600 text-sm mt-1">
                Beat your opponent's score to win!
              </p>
            </div>
          )}
          
          <GameComponent
            puzzle={puzzleData}
            difficulty={activeDifficulty}
            challengeId={challengeId}
            dailyPuzzleDate={puzzles.date}
          />
        </>
      );
    }
  }

  return (
    <div className={`container mx-auto h-full w-full shadow-md rounded-4xl p-4 sm:p-8 md:p-12 ${introData.bgColor}`}>
      {content}
    </div>
  );
};