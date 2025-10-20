// /src/pages/GamePage.tsx
import { useParams, Navigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { getDailyPuzzles } from '../api/gameService';
import { LoadingSpinner } from '../components/ui/loadingSpinner';

// Import your game components (we'll create WordleGame next)
import { WordleGame } from '../components/gameComponents/wordle/wordleGame';
// import { SudokuGame } from '../components/game-specific/sudoku/SudokuGame';
// import { ErnigramGame } from '../components/game-specific/ernigram/ErnigramGame';

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
      // return <SudokuGame puzzle={puzzles.sudoku} />;
      return <p className="text-center p-8">Sudoku component not built yet.</p>;
    case 'ernigram':
      // return <ErnigramGame puzzle={puzzles.ernigram} />;
      return <p className="text-center p-8">ERNIgram component not built yet.</p>;
    default:
      // If URL is invalid, go back home
      return <Navigate to="/" replace />;
  }
}