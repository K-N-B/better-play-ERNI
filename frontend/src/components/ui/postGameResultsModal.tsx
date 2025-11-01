import React, { useState } from 'react';
import { X, Trophy, Star } from 'lucide-react';
import { ChallengeModal } from '../features/challenge/challengeModal'; // Assuming this path is correct

interface PostGameResultsModalProps {
  score: number;
  onClose: () => void;
  submissionId: number | null; // Accept submissionId (can be null if submission failed)
  currentStreak?: number;
  maxStreak?: number;
  streakUpdatedToday?: boolean;
  message?: string;
}

export const PostGameResultsModal = ({
  score,
  onClose,
  submissionId,
  currentStreak,
  maxStreak,
  streakUpdatedToday,
  message,
}: PostGameResultsModalProps) => {
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);

  // Use the passed submissionId if available
  const effectiveSubmissionId = submissionId;
  const hasStreakData =
    typeof currentStreak === "number" && typeof maxStreak === "number";

  return (
    <> {/* Fragment for multiple root elements */}
      {/* --- Results Modal --- */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"> {/* Added backdrop blur */}
        <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-sm text-center relative mx-4"> {/* Added margin */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X size={24} /> {/* Slightly larger icon */}
          </button>

          <Trophy className="mx-auto text-yellow-500 mb-3" size={48} />
          <h2 className="text-xl font-bold mb-3 text-gray-800">Puzzle Complete!</h2>
          <p className="text-lg text-gray-700 mb-1">Your earned</p>
          <div className="font-bold text-primary text-4xl flex items-center justify-center gap-1 mb-4">
            {score}
            <Star size={30} className="text-yellow-500 fill-current" />
          </div>

          {message && (
            <p className="text-sm text-gray-500 mb-4">{message}</p>
          )}

          {hasStreakData && (
            <div className="mb-4 text-sm text-gray-600 space-y-1">
              <p>
                Current streak:&nbsp;
                <span className="font-semibold text-primary">
                  {currentStreak}
                </span>
                {streakUpdatedToday ? " 🔥" : ""}
              </p>
              <p>
                Max streak:&nbsp;
                <span className="font-semibold text-primary">{maxStreak}</span>
              </p>
            </div>
          )}

          {/* --- Challenge Button --- */}
          <button
            onClick={() => setIsChallengeModalOpen(true)}
            disabled={!effectiveSubmissionId} // Disable if no ID (submission failed)
            className="w-full px-6 py-3 mb-2 text-base text-white bg-primary rounded-lg shadow hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            title={!effectiveSubmissionId ? "Submission failed, cannot challenge" : "Challenge a colleague"}
          >
            Challenge a Colleague!
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
