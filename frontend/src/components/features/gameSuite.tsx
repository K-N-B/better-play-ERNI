// Renders the three cards on your homepage ("Play Wordle," "Play Sudoku," "Play ERNIgram") that link to the GamePage.

import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { getDailyPuzzles } from '../../api/gameService';
import { LoadingSpinner } from '../ui/loadingSpinner';
import { Puzzle, Brain, PenTool } from 'lucide-react'; // Example icons

// Define colors here or import from a shared theme/data file
const gameThemes = {
  wordle: { color: 'bg-emerald-500', shadow: 'shadow-emerald-900', icon: Puzzle },
  sudoku: { color: 'bg-pink-400', shadow: 'shadow-pink-800', icon: Brain },
  ernigram: { color: 'bg-sky-400', shadow: 'shadow-sky-800', icon: PenTool },
};

export const GameSuite = () => {
  // Fetch puzzle data to potentially show puzzle IDs or status later
  // For now, we mainly use it to confirm data is loaded
  const { data: puzzles, loading, error } = useApi(getDailyPuzzles);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !puzzles) {
    return <p className="p-8 text-center text-red-600">Could not load puzzles.</p>;
  }

  // --- Render the Game Cards ---
  return (
    <div className="p-8 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg shadow-inner border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Today's Puzzles</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Wordle Card */}
        <Link
          to="/game/wordle"
          className={`group block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow border-t-4 border-emerald-500`}
        >
          <gameThemes.wordle.icon className="w-8 h-8 text-emerald-500 mb-3" />
          <h3 className="text-xl font-semibold mb-2 text-gray-900 group-hover:text-emerald-600 transition-colors">Daily Wordle</h3>
          <p className="text-sm text-gray-600">Guess the 5-letter word.</p>
        </Link>

        {/* Sudoku Card */}
        <Link
          to="/game/sudoku"
          className={`group block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow border-t-4 border-pink-400`}
        >
          <gameThemes.sudoku.icon className="w-8 h-8 text-pink-400 mb-3" />
          <h3 className="text-xl font-semibold mb-2 text-gray-900 group-hover:text-pink-500 transition-colors">Daily Sudoku</h3>
          <p className="text-sm text-gray-600">A logic puzzle for your break.</p>
        </Link>

        {/* ERNIgram Card */}
        <Link
          to="/game/ernigram"
          className={`group block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow border-t-4 border-sky-400`}
        >
          <gameThemes.ernigram.icon className="w-8 h-8 text-sky-400 mb-3" />
          <h3 className="text-xl font-semibold mb-2 text-gray-900 group-hover:text-sky-500 transition-colors">ERNIgram</h3>
          <p className="text-sm text-gray-600">Company-themed hangman.</p>
        </Link>

      </div>
    </div>
  );
};

// Make sure to export it if using named exports
// export default GameSuite; // Or use default export