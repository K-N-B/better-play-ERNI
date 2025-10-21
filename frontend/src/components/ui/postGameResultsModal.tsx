// A modal that pops up after a game is submitted. It takes score, time, etc., as props. It contains the ChallengeModal (or a button to open it).

import { X } from 'lucide-react';

interface PostGameResultsModalProps {
  score: number;
  onClose: () => void;
  // You'll add time, challenge button, etc. later
}

export const PostGameResultsModal = ({ score, onClose }: PostGameResultsModalProps) => {
  return (
    // Modal overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 ">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
        
        <div className="text-3xl font-bold mb-4">You did it!</div>
        
        <p className="text-lg text-gray-700 mb-2">Your Score:</p>
        <p className="text-5xl font-bold text-blue-600 mb-6">{score}</p>
        
        {/* TODO: Add Challenge Button in Phase 5
          <ChallengeModal /> 
        */}
        
        <button
          onClick={onClose}
          className="mt-4 px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};