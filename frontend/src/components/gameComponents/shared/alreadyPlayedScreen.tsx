// src/components/gameComponents/shared/alreadyPlayedScreen.tsx - NEW FILE

import { Trophy, Star, Home, Swords } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AlreadyPlayedScreenProps {
  gameType: 'wordle' | 'sudoku' | 'ernigram';
  score: number;
  submittedAt: string;
  difficulty: string;
}

export const AlreadyPlayedScreen = ({ 
  gameType, 
  score, 
  submittedAt, 
  difficulty 
}: AlreadyPlayedScreenProps) => {
  const navigate = useNavigate();

  const gameColors = {
    wordle: {
      primary: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200'
    },
    sudoku: {
      primary: 'text-pink-600',
      bg: 'bg-pink-50',
      border: 'border-pink-200'
    },
    ernigram: {
      primary: 'text-sky-600',
      bg: 'bg-sky-50',
      border: 'border-sky-200'
    }
  };

  const colors = gameColors[gameType];
  const gameTitle = gameType.charAt(0).toUpperCase() + gameType.slice(1);

  // Format the submission time
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="flex items-center justify-center min-h-[500px] p-8">
      <div className={`max-w-md w-full ${colors.bg} border-2 ${colors.border} rounded-3xl p-8 text-center shadow-lg`}>
        {/* Trophy Icon */}
        <div className="mb-6">
          <Trophy className={`mx-auto ${colors.primary}`} size={64} strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <h2 className={`text-3xl font-bold mb-2 ${colors.primary}`}>
          Already Completed!
        </h2>
        
        <p className="text-gray-600 mb-6">
          You've already finished today's <strong>{gameTitle}</strong> puzzle on <strong>{difficulty}</strong> mode.
        </p>

        {/* Score Display */}
        <div className="bg-white p-6 rounded-2xl mb-6 shadow-sm">
          <p className="text-sm text-gray-500 mb-2">Your Score</p>
          <div className="flex items-center justify-center gap-2">
            <span className={`text-5xl font-bold ${colors.primary}`}>
              {score}
            </span>
            <Star size={36} className="text-yellow-500 fill-current" />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Completed at {formatTime(submittedAt)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Home size={20} />
            Back to Home
          </button>

          <button
            onClick={() => navigate('/challenges')}
            className={`w-full px-6 py-3 ${colors.primary} bg-white border-2 ${colors.border} rounded-xl font-medium hover:opacity-80 transition-opacity flex items-center justify-center gap-2`}
          >
            <Swords size={20} />
            View Challenges
          </button>
        </div>

        {/* Hint Text */}
        <p className="text-xs text-gray-500 mt-6">
          Come back tomorrow for a new puzzle!
        </p>
      </div>
    </div>
  );
};