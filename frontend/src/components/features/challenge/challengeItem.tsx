// src/components/features/challenge/challengeItem.tsx - FIXED NAVIGATION
import React from "react";
import { useNavigate } from "react-router-dom";
import type { Challenge } from "../../../types/challenge";
import {
  Swords,
  CheckCircle,
  Hourglass,
  X,
  Clock,
  Calendar,
} from "lucide-react";
import { clsx } from "clsx";

interface ChallengeItemProps {
  challenge: Challenge;
  onPlayClick?: () => Promise<void>;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 24) {
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? "Just now" : `${diffMinutes} minutes ago`;
    }
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }

  if (diffDays < 7) {
    return diffDays === 1 ? "Yesterday" : `${diffDays} days ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

export const ChallengeItem: React.FC<ChallengeItemProps> = ({
  challenge,
  onPlayClick,
}) => {
  const navigate = useNavigate();
  const isPending = challenge.status === "PENDING";
  const won = challenge.winner?.id === challenge.recipient?.id;
  const lost = challenge.winner?.id === challenge.challenger?.id;
  const opponent = challenge.challenger;

  const difficulty = challenge.challenger_submission?.difficulty || "easy";

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default navigation

    // Build the URL
    const gameUrl = `/game/${challenge.puzzle_type}?challenge_id=${challenge.id}&difficulty=${difficulty}`;

    // Call onPlayClick if it exists
    if (onPlayClick) {
      try {
        await onPlayClick();
      } catch (error) {
        console.error("[ChallengeItem] onPlayClick error:", error);
      }
    }

    // Use React Router navigation instead of window.location.href
    navigate(gameUrl);
  };

  return (
    <div
      className={clsx(
        "bg-white rounded-lg shadow p-4 border transition-all",
        isPending ? "border-blue-200 hover:border-blue-400" : "border-gray-200"
      )}
    >
      <div className="flex items-start space-x-3">
        {isPending ? (
          <Hourglass size={24} className="text-blue-500 mt-1" />
        ) : won ? (
          <CheckCircle size={24} className="text-green-500 mt-1" />
        ) : lost ? (
          <X size={24} className="text-red-500 mt-1" />
        ) : (
          <Swords size={24} className="text-gray-400 mt-1" />
        )}

        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800">
            Challenge {isPending ? "from" : "vs"} {opponent.username} on{" "}
            <span className="capitalize">{challenge.puzzle_type}</span>
            <span
              className={clsx(
                "ml-2 px-2 py-0.5 text-xs rounded font-semibold",
                difficulty === "hard"
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              )}
            >
              {difficulty.toUpperCase()}
            </span>
          </p>

          <p className="text-sm text-gray-600 mt-1">
            {opponent.username}'s Score:{" "}
            {challenge.challenger_submission.points_awarded} pts
          </p>

          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>Sent {formatDate(challenge.created_at)}</span>
            </div>

            {!isPending && challenge.recipient_submission && (
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>Completed {formatDate(challenge.created_at)}</span>
              </div>
            )}
          </div>

          {challenge.recipient_submission && (
            <div className="text-sm mt-2">
              Your Score: {challenge.recipient_submission.points_awarded} pts
              {won && (
                <span className="ml-2 text-green-600 font-semibold">
                  You Won!
                </span>
              )}
              {lost && (
                <span className="ml-2 text-red-600 font-semibold">
                  You Lost
                </span>
              )}
              {!isPending && !won && !lost && (
                <span className="ml-2 text-gray-600 font-semibold">Tie</span>
              )}
            </div>
          )}
        </div>

        {isPending && (
          <div className="ml-auto">
            <button
              onClick={handlePlayClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
            >
              Play Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
