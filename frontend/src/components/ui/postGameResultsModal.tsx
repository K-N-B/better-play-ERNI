import React, { useState } from 'react';
import { X, Trophy } from 'lucide-react';
import { ChallengeModal } from '../features/challenge/challengeModal'; // Assuming this path is correct

interface PostGameResultsModalProps {
  score: number;
  onClose: () => void;
  submissionId: number | null; // Accept submissionId (can be null if submission failed)
}

export const PostGameResultsModal = ({ score, onClose, submissionId }: PostGameResultsModalProps) => {
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);

  // Use the passed submissionId if available
  const effectiveSubmissionId = submissionId;

  return (
    <> {/* Fragment for multiple root elements */}
      {/* --- Results Modal --- */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"> {/* Added backdrop blur */}
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center relative mx-4"> {/* Added margin */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X size={24} /> {/* Slightly larger icon */}
          </button>

          <Trophy className="mx-auto text-yellow-500 mb-3" size={48} />
          <h2 className="text-xl font-bold mb-3 text-gray-800">Puzzle Complete!</h2>

          <p className="text-lg text-gray-700 mb-1">Your Score:</p>
          <p className="text-4xl font-bold text-blue-600 mb-6">{score}</p>

          {/* --- Challenge Button --- */}
          <button
            onClick={() => setIsChallengeModalOpen(true)}
            disabled={!effectiveSubmissionId} // Disable if no ID (submission failed)
            className="w-full px-6 py-3 mb-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-lg shadow hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            title={!effectiveSubmissionId ? "Submission failed, cannot challenge" : "Challenge a colleague"}
          >
            Challenge a Colleague!
          </button>
          {/* --- End Challenge Button --- */}

          <button
            onClick={onClose}
            className="w-full mt-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm" // Adjusted styling
          >
            Close
          </button>
        </div>
      </div>

      {/* --- Challenge Modal (Rendered conditionally) --- */}
      {/* Ensure submissionId is not null before rendering */}
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