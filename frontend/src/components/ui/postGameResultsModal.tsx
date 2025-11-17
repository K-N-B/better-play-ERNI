import { useState } from 'react';
import { X, Trophy, Star, Home, HeartCrack } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ChallengeModal } from '../features/challenge/challengeModal';

interface PostGameResultsModalProps {
  score: number;
  onClose: () => void;
  submissionId: number | null;
  gameType: 'wordle' | 'sudoku' | 'ernigram';
  puzzleId?: number;
  dailyPuzzleDate?: string;
}

export const PostGameResultsModal = ({
  score,
  onClose,
  submissionId,
  gameType,
  puzzleId,
  dailyPuzzleDate,
}: PostGameResultsModalProps) => {
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const navigate = useNavigate();

  const didWin = score > 0; // <-- Your win/loss logic

  const effectiveSubmissionId = submissionId;

  const handleReturnHome = () => {
    onClose();
    navigate('/');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-sm text-center relative mx-4">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>

          {/* Win or Fail Icon */}
          {didWin ? (
            <Trophy className="mx-auto text-yellow-500 mb-3" size={48} />
          ) : (
            <HeartCrack className="mx-auto text-red-500 mb-3" size={48} />
          )}

          {/* Title */}
          <h2 className="text-xl font-bold mb-3 text-gray-800">
            {didWin ? 'Puzzle Complete!' : 'Puzzle Failed'}
          </h2>

          {/* Subtitle */}
          <p className="text-sm text-gray-600 mb-1">
            {gameType.charAt(0).toUpperCase() + gameType.slice(1)} •{' '}
            {didWin ? 'Completed' : 'Not Completed'}
          </p>

          {/* Score Section (hidden if fail) */}
          {didWin ? (
            <>
              <p className="text-lg text-gray-700 mb-1">You earned</p>
              <div className="font-bold text-primary text-4xl flex items-center justify-center gap-1 mb-4">
                {score}
                <Star size={30} className="text-yellow-500 fill-current" />
              </div>
            </>
          ) : (
            <p className="text-gray-600 mb-4 text-sm">
              Oof… this one fought back. You can try again tomorrow.
            </p>
          )}

          {/* Challenge button (only if win) */}
          {didWin && (
            <button
              onClick={() => setIsChallengeModalOpen(true)}
              disabled={!effectiveSubmissionId || !puzzleId || !dailyPuzzleDate}
              className="w-full px-6 py-3 mb-2 text-base text-white bg-primary rounded-lg shadow hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              title={!effectiveSubmissionId ? 'Submission failed, cannot challenge' : 'Challenge a colleague'}
            >
              Challenge a Colleague!
            </button>
          )}

          {/* Return Home Button */}
          <button
            onClick={handleReturnHome}
            className="w-full px-6 py-3 text-base text-primary bg-white border-2 border-primary rounded-lg shadow hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Home size={20} />
            Return to Home
          </button>
        </div>
      </div>

      {didWin && effectiveSubmissionId !== null && puzzleId && dailyPuzzleDate && (
        <ChallengeModal
          isOpen={isChallengeModalOpen}
          onClose={() => setIsChallengeModalOpen(false)}
          submissionId={effectiveSubmissionId}
          puzzleType={gameType}
          puzzleId={puzzleId}
          dailyPuzzleDate={dailyPuzzleDate}
        />
      )}
    </>
  );
};
