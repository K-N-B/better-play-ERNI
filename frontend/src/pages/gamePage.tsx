// /src/pages/GamePage.tsx
import { useParams, Navigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { getDailyPuzzles } from '../api/gameService';
import { LoadingSpinner } from '../components/ui/loadingSpinner';

// Import your game components (we'll create WordleGame next)
import { WordleGame } from '../components/gameComponents/wordle/wordleGame';
import { SudokuGame } from '../components/gameComponents/sudoku/sudokuGame';
import { ErnigramGame } from '../components/gameComponents/ernigram/ernigramGame';

export const GamePage = () => {
  const { gameType } = useParams<{ gameType: string }>();

  // Fetch all puzzles
  const { data: puzzles, loading } = useApi(getDailyPuzzles);

  if (loading) {
    return <LoadingSpinner fullPage={true} />;
  }

  if (!puzzles) {
    return <p className="text-center p-8">Error loading puzzle data.</p>;
  }

  // Use a switch to render the correct game component
  switch (gameType) {
    case 'wordle':
      return <WordleGame puzzle={puzzles.wordle} />;
    case 'sudoku':
      return <SudokuGame puzzle={puzzles.sudoku} />;
    case 'ernigram':
      return <ErnigramGame puzzle={puzzles.ernigram} />;
    default:
      // If URL is invalid, go back home
      return <Navigate to="/" replace />;
  }
}