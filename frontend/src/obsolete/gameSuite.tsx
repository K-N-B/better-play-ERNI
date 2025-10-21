// Renders the three cards on your homepage ("Play Wordle," "Play Sudoku," "Play ERNIgram") that link to the GamePage.

import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { getDailyPuzzles } from '../api/gameService';
import { LoadingSpinner } from '../components/ui/loadingSpinner';
import { GameCard } from '../components/features/games/gameCard';
import { gameCardData } from '../data/gameCardData'; // Example icons

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
      <div className="text-2xl font-bold mb-6 text-center text-gray-800">Today's Puzzles</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
        {/* Map over the imported data */}
        {gameCardData.map((game) => (
          <GameCard
            key={game.title}
            title={game.title}
            subtitle={game.subtitle}
            bgColor={game.bgColor}
            shadowColor={game.shadowColor}
            IconComponent={game.IconComponent} // Pass the icon component
            path={game.path}
          />
        ))}
      </div>
    </div>
  );
};

// Make sure to export it if using named exports
// export default GameSuite; // Or use default export