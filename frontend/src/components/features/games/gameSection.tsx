
import { useApi } from '../../../hooks/useApi';
import { getDailyPuzzles } from '../../../api/gameService';
import { LoadingSpinner } from '../../ui/loadingSpinner';
import { GameCard } from './gameCard';
import { gameCardData } from '../../../data/gameCardData'; 
import { Puzzle } from 'lucide-react';// Assuming you have this

export const GamesSection = () => {
  // We still fetch puzzles to ensure they are available, but don't strictly need the data here
  const { loading, error } = useApi(getDailyPuzzles);

  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-lg shadow-md h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <p className="p-8 text-center text-red-600 bg-white rounded-lg shadow-md">Could not load games.</p>;
  }

  return (
    <div className="bg-white text-black rounded-4xl p-8 shadow-lg h-full flex flex-col">
      <div className='flex flex-row items-center justify-center gap-2 mb-2'>
        <Puzzle size={30} strokeWidth={2.5}/>
        <div className="text-4xl font-bold ">Games</div>
      </div>

      <p className="mb-4 text-black text-center leading-5">Choose your poison for today or experience all of them!</p>
      <div className="flex-grow grid grid-rows-3 gap-6">
        {gameCardData.map((game) => (
          <GameCard
            key={game.title}
            title={game.title}
            subtitle={game.subtitle}
            bgColor={game.bgColor} // Make cards semi-transparent? Adjust as needed
            shadowColor={game.shadowColor} // Adjust shadow
            IconComponent={game.IconComponent}
            path={game.path}
          />
        ))}
      </div>
    </div>
  );
};