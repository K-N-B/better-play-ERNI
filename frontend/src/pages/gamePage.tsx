// /src/pages/GamePage.tsx - UPDATED

import React, { useState, useEffect} from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { getDailyPuzzles } from '../api/gameService';
import { LoadingSpinner } from '../components/ui/loadingSpinner';
import GameIntro from '../components/features/games/gameIntro';

// Import your game components
import { WordleGame } from '../components/gameComponents/wordle/wordleGame';
import { SudokuGame } from '../components/gameComponents/sudoku/sudokuGame';
import { ErnigramGame } from '../components/gameComponents/ernigram/ernigramGame';

import type { DailyPuzzleResponse } from '../types';

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

export const GamePage = () => {
  const { gameType } = useParams<{ gameType: string }>();
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [hasStarted, setHasStarted] = useState(false);
  
  const { data: puzzles, loading: loadingPuzzles, error: error } = useApi(getDailyPuzzles);

  // Reset hasStarted and difficulty when the gameType (URL) changes
  useEffect(() => {
    setHasStarted(false);
    setDifficulty('easy');
  }, [gameType]);

  // Validate gameType and get introData
  const isValidGameType = gameType && gameType in introContent;
  const introData = isValidGameType ? introContent[gameType as keyof typeof introContent] : null;

  const isLoading = loadingPuzzles;
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
    return <Navigate to="/" replace />;
  }

  // Determine GameComponent and puzzleData
  let GameComponent: React.ComponentType<any> | null = null;
  let puzzleData: any = null;

  switch (gameType) {
    case 'wordle':
      GameComponent = WordleGame;
      puzzleData = difficulty === 'easy' ? puzzles.wordle_easy : puzzles.wordle_hard;
      break;
    case 'sudoku':
      GameComponent = SudokuGame;
      puzzleData = puzzles.sudoku;
      break;
    case 'ernigram':
      GameComponent = ErnigramGame;
      puzzleData = puzzles.ernigram;
      break;
    default:
      return <Navigate to="/" replace />;
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
        onStart={() => setHasStarted(true)}
        onDifficultyChange={setDifficulty}
        initialDifficulty={difficulty}
        color={introData.color}
        darkColor={introData.darkColor}
      />
    );
  } else {
    // Show Game
    if (!puzzleData || !GameComponent) {
      content = (
        <div className="text-center p-8 bg-white/50 rounded-lg">
          <h2 className="text-2xl font-bold text-red-600">Puzzle Not Available</h2>
          <p className="text-gray-700 mt-2">
            The {introData.title} puzzle for '{difficulty}' mode has not been set by the admin for today.
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
      // Show Game
      content = (
        <GameComponent
          puzzle={puzzleData}
          difficulty={difficulty}
          challengeId={null}
        />
      );
    }
  }

  return (
    <div className={`container mx-auto h-full w-full shadow-md rounded-4xl p-4 sm:p-8 md:p-12 ${introData.bgColor}`}>
      {content}
    </div>
  );
};