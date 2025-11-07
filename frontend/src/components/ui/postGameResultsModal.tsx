// src/components/ui/postGameResultsModal.tsx - COMPLETE VERSION
import { useState } from 'react';
import { X, Trophy, Star, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ChallengeModal } from '../features/challenge/challengeModal';

interface PostGameResultsModalProps {
  score: number;
  onClose: () => void;
  submissionId: number | null;
  // currentStreak: number;
  gameType: 'wordle' | 'sudoku' | 'ernigram'; // ✅ NEW: Track which game
}

export const PostGameResultsModal = ({ 
  score, 
  onClose, 
  submissionId,
  // currentStreak,
  gameType 
}: PostGameResultsModalProps) => {
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const navigate = useNavigate();
  const effectiveSubmissionId = submissionId;

  // ✅ NEW: Handler to return home
  const handleReturnHome = () => {
    onClose(); // Close modal first
    navigate('/'); // Then navigate
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

          <Trophy className="mx-auto text-yellow-500 mb-3" size={48} />
          <h2 className="text-xl font-bold mb-3 text-gray-800">Puzzle Complete!</h2>
          
          {/* ✅ ENHANCED: Show game type */}
          <p className="text-sm text-gray-600 mb-1">
            {gameType.charAt(0).toUpperCase() + gameType.slice(1)} • Completed
          </p>
          
          <p className="text-lg text-gray-700 mb-1">You earned</p>
          <div className="font-bold text-primary text-4xl flex items-center justify-center gap-1 mb-4">
            {score}
            <Star size={30} className="text-yellow-500 fill-current" />
          </div>
           {/* <p className="text-lg text-gray-700 mb-1">You are on a {currentStreak} day streak. Keep it up!</p> */}

          {/* ✅ Challenge Button */}
          <button
            onClick={() => setIsChallengeModalOpen(true)}
            disabled={!effectiveSubmissionId}
            className="w-full px-6 py-3 mb-2 text-base text-white bg-primary rounded-lg shadow hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            title={!effectiveSubmissionId ? "Submission failed, cannot challenge" : "Challenge a colleague"}
          >
            Challenge a Colleague!
          </button>

          {/* ✅ NEW: Return Home Button */}
          <button
            onClick={handleReturnHome}
            className="w-full px-6 py-3 text-base text-primary bg-white border-2 border-primary rounded-lg shadow hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Home size={20} />
            Return to Home
          </button>
        </div>
      </div>

      {effectiveSubmissionId !== null && (
        <ChallengeModal
          isOpen={isChallengeModalOpen}
          onClose={() => setIsChallengeModalOpen(false)}
          submissionId={effectiveSubmissionId}
        />
      )}
    </>
  );
};