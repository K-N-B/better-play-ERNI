// /src/pages/GamePage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { getDailyPuzzles } from '../api/gameService';
import { LoadingSpinner } from '../components/ui/loadingSpinner';
import GameIntro from '../components/features/games/gameIntro'; // Keep this import

// Import your game components
import { WordleGame } from '../components/gameComponents/wordle/wordleGame';
import { SudokuGame } from '../components/gameComponents/sudoku/sudokuGame';
import { ErnigramGame } from '../components/gameComponents/ernigram/ernigramGame';

// Define game intro content (move this to a separate data file later if desired)
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

export const GamePage = () => {
  const { gameType } = useParams<{ gameType: string }>();
  const [difficulty, setDifficulty] = useState<Difficulty>('easy'); // Single difficulty state
  const [hasStarted, setHasStarted] = useState(false); // State to track if intro is passed

  const { data: puzzles, loading: loadingPuzzles } = useApi(getDailyPuzzles);
  // No need to fetch submissions here anymore

  useEffect(() => {
    setHasStarted(false); // Reset to show intro for the new game
    setDifficulty('easy'); // Optionally reset difficulty selection too
  }, [gameType]);
  

  // Validate gameType and get introData
  const isValidGameType = gameType && gameType in introContent;
  const introData = isValidGameType ? introContent[gameType as keyof typeof introContent] : null;


  const isLoading = loadingPuzzles; // Only check puzzle loading
  if (isLoading) {
    return <LoadingSpinner fullPage={true} />;
  }

  // Navigate away if invalid game type OR required data missing
  if (!puzzles || !isValidGameType || !introData) {
    console.error("Invalid game type or missing puzzle/intro data:", gameType);
    return <Navigate to="/" replace />;
  }

  // Determine GameComponent and puzzleData
  let GameComponent: React.ComponentType<any> | null = null;
  let puzzleData: any = null;

  switch (gameType) {
    case 'wordle': GameComponent = WordleGame; puzzleData = puzzles.wordle; break;
    case 'sudoku': GameComponent = SudokuGame; puzzleData = puzzles.sudoku; break;
    case 'ernigram': GameComponent = ErnigramGame; puzzleData = puzzles.ernigram; break;
  }

  // --- RENDER LOGIC ---
  let content;
  if (!hasStarted) {
    // Show Intro
    content = (
      <GameIntro
        title={introData.title}
        description={introData.description}
        howToPlay={introData.howToPlay}
        pointsInfo={introData.pointsInfo}
        hintInfo={introData.hintInfo}
        onStart={() => setHasStarted(true)} // Just set started to true
        onDifficultyChange={setDifficulty} // Update the shared difficulty state
        initialDifficulty={difficulty} // Pass the current shared state
        color={introData.color}
        darkColor={introData.darkColor}
      />
    );
  } else {
    // Show Game
    content = GameComponent ? (
      <GameComponent
        puzzle={puzzleData}
        difficulty={difficulty} // Pass the shared difficulty state
        challengeId={null} // We removed challengeId logic from here for now
        // REMOVED onGameComplete prop
      />
    ) : (
       <p>Error: Could not load game component for {gameType}.</p>
    );
  }

  return (
    <div className={`h-full w-full rounded-3xl p-4 sm:p-8 md:p-12 ${introData.bgColor}`}>
      {content}
    </div>
  );
}