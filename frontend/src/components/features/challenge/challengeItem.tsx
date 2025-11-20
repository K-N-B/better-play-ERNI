// src/components/features/challenge/challengeItem.tsx - UPDATED FOR BOTH ROLES
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/authContext";
import type { Challenge } from "../../../types/challenge";
import { getChallengeExpiryStatus, getUrgencyColorClasses } from "../../../types/challenge";
import {
  Swords,
  CheckCircle,
  Hourglass,
  X,
  Clock,
  Calendar,
  AlertCircle,
  Send,
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
  const { user } = useAuth();
  
  const isPending = challenge.status === "PENDING";
  const isExpired = challenge.status === "EXPIRED";
  const isCompleted = challenge.status === "COMPLETED";
  
  // Determine role: am I the challenger or recipient?
  const isChallenger = user?.id === challenge.challenger?.id;
  const isRecipient = user?.id === challenge.recipient?.id;
  
  const won = challenge.winner?.id === challenge.recipient?.id;
  const lost = challenge.winner?.id === challenge.challenger?.id;
  
  // The "other person" in the challenge
  const opponent = isChallenger ? challenge.recipient : challenge.challenger;

  const difficulty = challenge.challenger_submission?.difficulty || "easy";

  // Live countdown state
  const [expiryStatus, setExpiryStatus] = useState(() =>
    getChallengeExpiryStatus(challenge)
  );

  // Update countdown every 30 seconds
  useEffect(() => {
    if (!isPending || !challenge.expires_at) return;

    const updateExpiry = () => {
      setExpiryStatus(getChallengeExpiryStatus(challenge));
    };

    updateExpiry();
    const interval = setInterval(updateExpiry, 30000);

    return () => clearInterval(interval);
  }, [isPending, challenge]);

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    const gameUrl = `/game/${challenge.puzzle_type}?challenge_id=${challenge.id}&difficulty=${difficulty}`;

    if (onPlayClick) {
      try {
        await onPlayClick();
      } catch (error) {
        console.error("[ChallengeItem] onPlayClick error:", error);
      }
    }

    navigate(gameUrl);
  };

  // Get urgency colors
  const urgencyColors = getUrgencyColorClasses(expiryStatus.urgency);

  return (
    <div
      className={clsx(
        "bg-white rounded-lg shadow p-4 border transition-all",
        isPending && !expiryStatus.isExpired
          ? isChallenger
            ? "border-purple-200 hover:border-purple-400"  // Different color for sent challenges
            : "border-blue-200 hover:border-blue-400"
          : isExpired
          ? "border-orange-200 opacity-75"
          : "border-gray-200"
      )}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        {isPending && !expiryStatus.isExpired ? (
          isChallenger ? (
            <Send size={24} className="text-purple-500 mt-1" />  // Sent icon for challenger
          ) : (
            <Hourglass size={24} className="text-blue-500 mt-1" />
          )
        ) : isExpired || expiryStatus.isExpired ? (
          <AlertCircle size={24} className="text-orange-500 mt-1" />
        ) : won ? (
          <CheckCircle size={24} className="text-green-500 mt-1" />
        ) : lost ? (
          <X size={24} className="text-red-500 mt-1" />
        ) : (
          <Swords size={24} className="text-gray-400 mt-1" />
        )}

        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800">
            {/* Different text for challenger vs recipient */}
            {isPending && isChallenger ? (
              <>Waiting for <span className="text-purple-600">{opponent.username}</span> on </>
            ) : isPending && isRecipient ? (
              <>Challenge from <span className="text-blue-600">{opponent.username}</span> on </>
            ) : isExpired ? (
              <>Challenge from {opponent.username} on </>
            ) : (
              <>Challenge vs {opponent.username} on </>
            )}
            <span className="capitalize">{challenge.puzzle_type}</span>
            
            {/* Difficulty Badge */}
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
            
            {/* Expired Badge */}
            {(isExpired || expiryStatus.isExpired) && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded font-semibold bg-orange-100 text-orange-700">
                EXPIRED
              </span>
            )}
          </p>

          <p className="text-sm text-gray-600 mt-1">
            {isChallenger ? "Your" : `${opponent.username}'s`} Score:{" "}
            {challenge.challenger_submission.points_awarded} pts
          </p>

          {/* Recipient Score (for completed) */}
          {challenge.recipient_submission && isCompleted && (
            <div className="text-sm mt-2">
              {isRecipient ? "Your" : `${challenge.recipient.username}'s`} Score:{" "}
              {challenge.recipient_submission.points_awarded} pts
              {won && isRecipient && (
                <span className="ml-2 text-green-600 font-semibold">
                  You Won!
                </span>
              )}
              {lost && isRecipient && (
                <span className="ml-2 text-red-600 font-semibold">
                  You Lost
                </span>
              )}
              {won && isChallenger && (
                <span className="ml-2 text-red-600 font-semibold">
                  They Won!
                </span>
              )}
              {lost && isChallenger && (
                <span className="ml-2 text-green-600 font-semibold">
                  You Won!
                </span>
              )}
              {!won && !lost && (
                <span className="ml-2 text-gray-600 font-semibold">Tie</span>
              )}
            </div>
          )}

          {/* Date and Time Information */}
          <div className="flex items-center gap-3 mt-2 text-xs flex-wrap">
            {/* Created Date */}
            <div className="flex items-center gap-1 text-gray-500">
              <Calendar size={14} />
              <span>
                {isChallenger ? "Sent" : "Received"} {formatDate(challenge.created_at)}
              </span>
            </div>

            {/* Time Remaining (for pending) */}
            {isPending &&
              !expiryStatus.isExpired &&
              expiryStatus.timeRemaining && (
                <div
                  className={clsx(
                    "flex items-center gap-1 font-medium",
                    urgencyColors.text
                  )}
                >
                  <Clock size={14} />
                  <span>{expiryStatus.timeRemaining}</span>
                </div>
              )}

            {/* Completed Date */}
            {isCompleted && challenge.completed_at && (
              <div className="flex items-center gap-1 text-gray-500">
                <Clock size={14} />
                <span>Completed {formatDate(challenge.completed_at)}</span>
              </div>
            )}

            {/* Expired Indicator */}
            {(isExpired || expiryStatus.isExpired) && (
              <div className="flex items-center gap-1 text-orange-600 font-medium">
                <AlertCircle size={14} />
                <span>Challenge expired</span>
              </div>
            )}
          </div>

          {/* Expiry Message */}
          {(isExpired || expiryStatus.isExpired) && (
            <div className="text-sm mt-2 text-orange-600 italic">
              This challenge was not completed in time and has expired.
            </div>
          )}

          {/* Waiting Message (for challenger) */}
          {isPending && isChallenger && !expiryStatus.isExpired && (
            <div className="text-sm mt-2 text-purple-600 italic">
              Waiting for {opponent.username} to complete the challenge...
            </div>
          )}

          {/* Urgency Warning (for recipient only) */}
          {isPending &&
            isRecipient &&
            expiryStatus.urgency === "critical" &&
            !expiryStatus.isExpired && (
              <div
                className={clsx(
                  "text-xs mt-2 px-2 py-1 rounded flex items-center gap-1",
                  urgencyColors.bg,
                  urgencyColors.text,
                  urgencyColors.border,
                  "border"
                )}
              >
                <AlertCircle size={12} />
                <span className="font-medium">
                  Expires soon! Play now to accept the challenge.
                </span>
              </div>
            )}
        </div>

        {/* Play Now Button (only for recipient on non-expired pending) */}
        {isPending && isRecipient && !isExpired && !expiryStatus.isExpired && (
          <div className="ml-auto">
            <button
              onClick={handlePlayClick}
              className={clsx(
                "px-4 py-2 rounded-md transition-colors text-sm font-medium whitespace-nowrap",
                expiryStatus.urgency === "critical"
                  ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                  : expiryStatus.urgency === "warning"
                  ? "bg-orange-600 hover:bg-orange-700 text-white"
                  : "bg-primary-500 shadow-primary-800 text-white shadow-[0_5px_0_0] hover:shadow-[0_3px_0_0] active:shadow-[0_1px_0_0] hover:translate-y-1 active:translate-y-2 transition-all"
              )}
            >
              Play Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};