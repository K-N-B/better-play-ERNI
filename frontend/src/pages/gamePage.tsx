// /src/pages/GamePage.tsx
import { useState, useEffect } from 'react';
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

// Type for storing the *locked-in* difficulty once started
interface StartedGamesState {
  [gameType: string]: Difficulty | null; // null means not started yet
}
export const GamePage = () => {
  const { gameType } = useParams<{ gameType: string }>();
  // State 1: Tracks the difficulty SELECTED on the intro screen (defaults to 'easy')
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');

  // State 2: Tracks which games have been STARTED and their locked difficulty
  // (In a real app, load this from localStorage or backend)
  const [startedGames, setStartedGames] = useState<StartedGamesState>({});

  // Fetch puzzle data (remains the same)
  const { data: puzzles, loading } = useApi(getDailyPuzzles);

  // --- Get the locked-in difficulty for the current game, if it exists ---
  const lockedDifficulty = gameType ? startedGames[gameType] : null;

  // --- Handler for the Intro screen's toggle ---
  const handleDifficultySelection = (newDifficulty: Difficulty) => {
    setSelectedDifficulty(newDifficulty); // Just update the selection
  };

  // --- Handler for the Intro screen's "Start" button ---
  const handleStartGame = () => {
    if (gameType) {
      // Lock the currently selected difficulty for this game
      setStartedGames(prev => ({
        ...prev,
        [gameType]: selectedDifficulty,
      }));
      // (No need for hasStarted state anymore)
    }
  };

  // --- Reset selected difficulty when game changes (for Intro screen) ---
  useEffect(() => {
     setSelectedDifficulty('easy'); // Reset selection when navigating to a new game type
  }, [gameType]);

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
  // --- DECIDE: Show Intro or Game ---
  // If a difficulty is already locked for this game, go straight to the game
  if (lockedDifficulty) {
    return (
      <div className={`h-full w-full rounded-3xl p-12 ${introData.bgColor}`}>
        {GameComponent && (
          <GameComponent
            puzzle={puzzleData}
            difficulty={lockedDifficulty} // Pass the LOCKED difficulty
          />
        )}
      </div>
    );
  } else {
    // Otherwise, show the Intro screen
    return (
      <div className={`h-full w-full rounded-3xl p-12 ${introData.bgColor}`}>
        <GameIntro
          title={introData.title}
          description={introData.description}
          howToPlay={introData.howToPlay}
          pointsInfo={introData.pointsInfo}
          hintInfo={introData.hintInfo}
          onStart={handleStartGame} // <-- Use the handler that locks the difficulty
          onDifficultyChange={handleDifficultySelection} // <-- Use the handler for selection
          initialDifficulty={selectedDifficulty} // <-- Show the current selection
          color={introData.color}
          darkColor={introData.darkColor}
        />
      </div>
    );
  }
}