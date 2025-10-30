
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
    return <p className="p-8 text-center text-red-600 bg-white rounded-lg shadow-md">There are no game yet for now!</p>;
  }

  return (
    <div className="bg-white text-black rounded-4xl p-8 shadow-lg h-full flex flex-col">
      <h3 className='text-xl font-semibold mb-3 flex items-center space-x-2 justify-center'>
        <Puzzle size={22} strokeWidth={2.5}/>
        <div className="text-xl font-semibold ">Games</div>
      </h3>

      <p className="mb-4 text-black text-center text-base leading-5">Choose your poison for today or experience all of them!</p>
      <div className="flex-grow grid grid-cols-3 lg:grid-cols-1 gap-6">
        {gameCardData.map((game) => (
          <GameCard
            key={game.title}
            title={game.title}
            subtitle={game.subtitle}
            bgColor={game.bgColor}
            shadowColor={game.shadowColor}
            IconComponent={game.IconComponent}
            path={game.path}
          />
        ))}
      </div>
    </div>
  );
};