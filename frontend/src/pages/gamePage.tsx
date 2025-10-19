// /src/pages/GamePage.tsx
import { useParams, Navigate } from 'react-router-dom';
// import { useApi } from '../hooks/useApi'; // We'll use this later
// import { getDailyPuzzles } from '../api/gameService'; // We'll use this later
// import { LoadingSpinner } from '../components/ui/loadingSpinner';

// Use 'export default' to match your other pages
export const GamePage = () => {
  const { gameType } = useParams<{ gameType: string }>();

  // We'll uncomment this logic once you're in Phase 2
  /*
  const { data: puzzles, loading } = useApi(getDailyPuzzles);

  if (loading) {
    return <LoadingSpinner fullPage={true} />;
  }

  if (!puzzles) {
    return <p>Error loading puzzle.</p>;
  }

  // Use a switch to render the correct game component
  switch (gameType) {
    case 'wordle':
      // return <WordleGame puzzle={puzzles.wordle} />;
      return <p>Wordle Game Here</p>
    case 'sudoku':
      // return <SudokuGame puzzle={puzzles.sudoku} />;
      return <p>Sudoku Game Here</p>;
    case 'ernigram':
      // return <ErnigramGame puzzle={puzzles.ernigram} />;
      return <p>ERNIgram Game Here</p>;
    default:
      // If URL is invalid, go back home
      return <Navigate to="/" replace />;
  }
  */

  // --- ADD THIS PLACEHOLDER FOR NOW ---
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Game Page</h1>
      <p>You are on the page for: <strong>{gameType}</strong></p>
    </div>
  );
}