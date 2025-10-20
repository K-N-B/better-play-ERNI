// /src/pages/GamePage.tsx
import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { getDailyPuzzles } from '../api/gameService';
import { LoadingSpinner } from '../components/ui/loadingSpinner';
import GameIntro from '../components/features/gameIntro';

// Import your game components (we'll create WordleGame next)
import { WordleGame } from '../components/gameComponents/wordle/wordleGame';
import { SudokuGame } from '../components/gameComponents/sudoku/sudokuGame';
import { ErnigramGame } from '../components/gameComponents/ernigram/ernigramGame';

const introContent = {
  wordle: {
    title: 'Wordle',
    description: 'Guess the hidden <strong>5-letter word</strong>.',
    howToPlay: `You have a set number of tries to guess the word.\nType a 5-letter word and press Enter.\nTiles change color to show how close your guess was:\n<strong class="text-emerald-500">Green</strong>: Correct letter, correct spot.\n<strong class="text-yellow-400">Yellow</strong>: Correct letter, wrong spot.\n<strong class="text-gray-600">Gray</strong>: Letter not in the word.`,
    pointsInfo: 'Earn points based on how many tries you take. Fewer tries = more points!',
    hintInfo: 'Hard mode gives you fewer tries!',
    color: 'bg-emerald-500', // Match Wordle theme
    darkColor: 'shadow-emerald-900',
    bgColor: 'bg-emerald-200'
  },
  sudoku: {
    title: 'Sudoku',
    description: 'Fill the <strong>9x9 grid</strong> so each row, column, and 3x3 box contains digits 1-9 without repeating.',
    howToPlay: `Click a cell to select it.\nUse the number pad to enter digits.\nToggle "Note Mode" (<span class="inline-block align-middle mx-1">📝</span>) to pencil in possibilities.\nCells will turn <strong class="text-red-500">red</strong> if they conflict with another number.`,
    pointsInfo: 'Earn points based on how quickly you solve the puzzle.',
    hintInfo: 'Hard mode gives you fewer starting numbers.',
    color: 'bg-pink-400', // Match Sudoku theme
    darkColor: 'shadow-pink-800',
    bgColor: 'bg-pink-200'
  },
  ernigram: {
    title: 'ERNIgram',
    description: 'Guess the hidden phrase related to <strong>ERNI culture, values, or tools</strong>.',
    howToPlay: `Guess letters one by one using the keyboard.\nEach incorrect guess reduces your remaining attempts.\nTry to solve the phrase before you run out of guesses!`,
    pointsInfo: 'Earn points based on remaining attempts and time.',
    hintInfo: 'Hard mode gives you significantly fewer attempts!',
    color: 'bg-sky-400', // Match ERNIgram theme
    darkColor: 'shadow-sky-800',
    bgColor: 'bg-sky-200'
  },
};

export type Difficulty = "easy" | "hard";
export const GamePage = () => {
  const { gameType } = useParams<{ gameType: string }>();
  const [difficulty, setDifficulty] = useState<Difficulty>('easy'); // <-- State for difficulty
  const [hasStarted, setHasStarted] = useState(false); // <-- State to track if game started

  // Fetch puzzle data (remains the same)
  const { data: puzzles, loading } = useApi(getDailyPuzzles);

  if (loading) {
    return <LoadingSpinner fullPage={true} />;
  }

  if (!puzzles || !gameType || !(gameType in introContent)) {
    // Navigate home if puzzle data or gameType is invalid
    return <Navigate to="/" replace />;
  }

  // --- Determine which component and data to use ---
  let GameComponent: React.ComponentType<any> | null = null;
  let puzzleData: any = null;
  const introData = introContent[gameType as keyof typeof introContent];

  switch (gameType) {
    case 'wordle':
      GameComponent = WordleGame;
      puzzleData = puzzles.wordle;
      break;
    case 'sudoku':
      GameComponent = SudokuGame;
      puzzleData = puzzles.sudoku;
      // TODO: Ideally, backend sends different puzzle strings for easy/hard.
      // For now, we'll pass difficulty down and let Sudoku handle logic if needed.
      break;
    case 'ernigram':
      GameComponent = ErnigramGame;
      puzzleData = puzzles.ernigram;
      break;
    default:
      return <Navigate to="/" replace />;
  }

  // --- Render Intro or Game ---
  if (!hasStarted) {
    return (
      <div className={`h-full w-full rounded-3xl p-12 ${introData.bgColor}`}>
        <GameIntro
          title={introData.title}
          description={introData.description}
          howToPlay={introData.howToPlay}
          pointsInfo={introData.pointsInfo}
          hintInfo={introData.hintInfo}
          onStart={() => setHasStarted(true)} // <-- Set started state on click
          onDifficultyChange={setDifficulty} // <-- Update difficulty state
          color={introData.color}
          darkColor={introData.darkColor}
        />
      </div>
    );
  } else {
    // Render the actual game component, passing puzzle data AND difficulty
    return <div className={`h-full w-full rounded-3xl p-12 ${introData.bgColor}`}> <GameComponent puzzle={puzzleData} difficulty={difficulty} /> </div>;
  }
}