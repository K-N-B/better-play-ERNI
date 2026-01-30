// src/components/features/activityFeed/activityFeedItem.tsx
// ✅ FINAL VERSION: Red background + direct "failed" message for lost puzzles
import React from 'react';
import type { ActivityEvent } from '../../../types/activity';
import clsx from 'clsx';
import { formatTimeAgo } from '../../../utils/timeFormat';
import { Swords, Brain, PenTool, TextInitial, ShoppingBag } from 'lucide-react';

interface ActivityFeedItemProps {
  event: ActivityEvent;
}

// ===== Unified Activity Styles and Icons =====

const activityConfig = {
  puzzles: {
    Sudoku: {
      icon: Brain,
      text: "text-pink-600",
      bg: "bg-pink-100/60",
      avatarBg: "bg-pink-400",
      avatarText: "text-pink-800",
    },
    Wordle: {
      icon: TextInitial,
      text: "text-emerald-600",
      bg: "bg-emerald-100/60",
      avatarBg: "bg-emerald-400",
      avatarText: "text-emerald-800",
    },
    ERNIgram: {
      icon: PenTool,
      text: "text-sky-600",
      bg: "bg-sky-100/60",
      avatarBg: "bg-sky-400",
      avatarText: "text-sky-800",
    },
  },

  challenge: {
    icon: Swords,
    text: "text-orange-600",
    bg: "bg-orange-100/60",
    avatarBg: "bg-orange-400",
    avatarText: "text-orange-900",
  },

  shop: {
    icon: ShoppingBag,
    text: "text-yellow-600",
    bg: "bg-yellow-100/40",
    avatarBg: "bg-amber-400",
    avatarText: "text-yellow-900",
  },
};


// Helper: Render avatar with profile picture or initial
const UserAvatar: React.FC<{
  user: { username: string; profile_picture_url: string | null };
  styleClasses: { avatarBg: string; avatarText: string };
}> = ({ user, styleClasses }) => {
  const userInitial = user.username.charAt(0).toUpperCase();

  return (
    <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden shadow-md">
      {user.profile_picture_url ? (
        <img
          src={user.profile_picture_url}
          alt={`${user.username} profile picture`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className={clsx(
          "w-full h-full flex items-center justify-center text-xl font-bold bg-white",
          styleClasses.avatarText
        )}>
          {userInitial}
        </div>
      )}
    </div>
  );
};

const AvatarWithBadge: React.FC<{
  user: { username: string; profile_picture_url: string | null };
  styleClasses: { avatarBg: string; avatarText: string };
  BadgeIcon: React.FC<any>;
  badgeColor: string;
}> = ({ user, styleClasses, BadgeIcon, badgeColor }) => {

  return (
    <div className="relative shrink-0 w-10 h-10">
      <UserAvatar user={user} styleClasses={styleClasses} />

      {/* Badge */}
      <div
        className={clsx(
          "absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-6 h-6 rounded-full flex items-center justify-center shadow-md",
          badgeColor
        )}
      >
        <BadgeIcon size={12} className="text-white" />
      </div>

    </div>
  );
};


export const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({ event }) => {
  const timeAgo = formatTimeAgo(event.created_at);

  // 🔍 DEBUG: Log the full event to see what we're receiving
  console.log("🔍 [ActivityFeedItem] Full event:", JSON.stringify(event, null, 2));
  console.log("🔍 [ActivityFeedItem] Event type:", event.event_type);
  console.log("🔍 [ActivityFeedItem] Has user?", !!event.user);
  console.log("🔍 [ActivityFeedItem] Has reward?", !!event.reward);

  // Submission styling
  const puzzleCfg = event.puzzle_name
    ? activityConfig.puzzles[event.puzzle_name]
    : null;

  // Challenge styling (always orange)
  const challengeCfg = activityConfig.challenge;

  // Shop styling (purple)
  const shopCfg = activityConfig.shop;

  // ✅ UPDATED: SUBMISSION EVENT with RED BACKGROUND for failed puzzles
  if (event.event_type === 'submission' && event.user && puzzleCfg) {
    console.log("✅ Rendering submission event");
    
    // ✅ NEW: Determine if puzzle was won or lost
    const puzzleWon = event.puzzle_won !== false; // Default to true if not specified
    
    // ✅ RED BACKGROUND for failed puzzles
    const bgColor = puzzleWon ? puzzleCfg.bg : "bg-red-100/80";
    
    return (
      <div className={clsx("flex items-start space-x-4 p-3 sm:p-4 rounded-xl relative", bgColor)}>
        <AvatarWithBadge
          user={event.user}
          styleClasses={puzzleCfg}
          BadgeIcon={puzzleCfg.icon}
          badgeColor={puzzleCfg.avatarBg}
        />

        <div className="flex-1 min-w-0">
          {puzzleWon ? (
            // ✅ WON: Original message
            <div className="text-gray-700 text-sm sm:text-base leading-snug">
              <strong className="text-gray-900 font-semibold">{event.user.username}</strong>
              <span> just finished answering today's </span>
              <strong className={clsx("font-semibold", puzzleCfg.text)}>{event.puzzle_name}</strong>
              <span> puzzle in </span>
              <strong className="text-gray-900 font-semibold">{event.difficulty}</strong>
              <span> mode in just </span>
              <strong className="text-gray-900 font-semibold">{event.time_in_minutes} minutes</strong>
              <span className="text-base ml-1">✅</span>
              <span>!</span>
            </div>
          ) : (
            // ❌ FAILED: New direct message with emphasis
            <div className={clsx("text-sm sm:text-base leading-snug text-gray-900")}>
              <strong className="text-gray-900 font-bold text-base">{event.user.username}</strong>
              <strong className="text-red-700 font-bold"> failed </strong>
              <span>today's </span>
              <strong className={clsx("font-semibold", puzzleCfg.text)}>{event.puzzle_name}</strong>
              <span> puzzle in </span>
              <strong className="font-semibold">{event.difficulty}</strong>
              <span> mode </span>
              <span className="text-xl">❌</span>
            </div>
          )}

          <div className="text-xs text-gray-500 mt-1">{timeAgo}</div>
        </div>
      </div>
    );
  }

  // CHALLENGE SENT EVENT
  if (event.event_type === 'challenge_sent' && event.challenger && event.recipient) {
    console.log("✅ Rendering challenge_sent event");
    return (
      <div className={clsx("flex items-start space-x-4 p-3 sm:p-4 rounded-xl relative", challengeCfg.bg)}>
        <AvatarWithBadge
          user={event.challenger}
          styleClasses={challengeCfg}
          BadgeIcon={challengeCfg.icon}
          badgeColor={challengeCfg.avatarBg}
        />

        <div className="flex-1 min-w-0">
          <div className="text-gray-700 text-sm sm:text-base leading-snug">
            <strong className="text-gray-900 font-semibold">{event.challenger.username}</strong>
            <span> challenged </span>
            <strong className="text-gray-900 font-semibold">{event.recipient.username}</strong>
            <span> to beat their </span>
            <strong className={clsx("font-semibold", challengeCfg.text)}>{event.puzzle_name}</strong>
            <span> score on </span>
            <strong className="text-gray-900 font-semibold">{event.difficulty}</strong>
            <span> difficulty!</span>
          </div>

          <div className="text-xs text-gray-500 mt-1">{timeAgo}</div>
        </div>
      </div>
    );
  }

  // ✅ UPDATED: CHALLENGE COMPLETED EVENT with visual win/loss indicators
  if (event.event_type === "challenge_completed" && event.challenger && event.recipient) {
    console.log("✅ Rendering challenge_completed event");
    
    // ✅ NEW: Determine outcome with visual indicators
    let outcomeText;
    let outcomeColor;
    let outcomeIcon;
    
    if (!event.winner) {
      outcomeText = 'TIED with';
      outcomeColor = 'text-gray-700';
      outcomeIcon = '🤝';
    } else if (event.winner.id === event.recipient.id) {
      outcomeText = 'WON against';
      outcomeColor = 'text-green-600';
      outcomeIcon = '🏆';
    } else {
      outcomeText = 'LOST to';
      outcomeColor = 'text-red-600';
      outcomeIcon = '❌';
    }

    // ✅ NEW: Include scores if available
    const showScores = event.challenger_score !== undefined && event.recipient_score !== undefined;

    return (
      <div className={clsx("flex items-start space-x-4 p-3 rounded-xl", challengeCfg.bg)}>
        <AvatarWithBadge
          user={event.recipient}
          styleClasses={challengeCfg}
          BadgeIcon={challengeCfg.icon}
          badgeColor={challengeCfg.avatarBg}
        />

        <div className="flex-1 min-w-0">
          <div className="text-gray-700 text-sm sm:text-base leading-snug">
            <strong className="text-gray-900 font-semibold">{event.recipient.username}</strong>
            <span> completed </span>
            <strong className="text-gray-900 font-semibold">{event.challenger.username}</strong>
            <span>'s </span>
            <strong className={clsx("font-semibold", challengeCfg.text)}>{event.puzzle_name}</strong>
            <span> challenge and </span>
            
            {/* ✅ NEW: Visual outcome indicator */}
            <span className="inline-flex items-center gap-1">
              <span className="text-base">{outcomeIcon}</span>
              <strong className={clsx("font-bold", outcomeColor)}>{outcomeText}</strong>
            </span>
            <span> them</span>
            
            {/* ✅ NEW: Show scores if available */}
            {showScores && (
              <span className="text-xs text-gray-600">
                {' '}({event.recipient_score} vs {event.challenger_score} pts)
              </span>
            )}
            <span>!</span>
          </div>

          <div className="text-xs text-gray-500 mt-1">{timeAgo}</div>
        </div>
      </div>
    );
  }

  // SHOP PURCHASE EVENT
  if (event.event_type === 'shop_purchase') {
    console.log("🛒 Attempting to render shop_purchase event");
    console.log("🛒 User exists?", !!event.user);
    console.log("🛒 Reward exists?", !!event.reward);

    if (event.user && event.reward) {
      console.log("✅ Rendering shop_purchase event");
      return (
        <div className={clsx("flex items-start space-x-4 p-3 sm:p-4 rounded-xl relative", shopCfg.bg)}>
          <AvatarWithBadge
            user={event.user}
            styleClasses={shopCfg}
            BadgeIcon={shopCfg.icon}
            badgeColor={shopCfg.avatarBg}
          />

          <div className="flex-1 min-w-0">
            <div className="text-gray-700 text-sm sm:text-base leading-snug">
              <strong className="text-gray-900 font-semibold">{event.user.username}</strong>
              <span> purchased </span>
              <strong className={clsx("font-semibold", shopCfg.text)}>{event.reward.name}</strong>
              <span> for </span>
              <strong className="text-gray-900 font-semibold">{event.points_spent} points</strong>
              <span>. Grab one for yourself now!</span>
            </div>

            <div className="text-xs text-gray-500 mt-1">{timeAgo}</div>
          </div>

          {/* Optional: Show reward image if available */}
          {event.reward.image && (
            <img
              src={event.reward.image}
              alt={event.reward.name}
              className="shrink-0 w-12 h-12 rounded-lg object-cover shadow-sm"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
        </div>
      );
    } else {
      console.error("❌ Shop purchase missing required data - user:", event.user, "reward:", event.reward);
    }
  }

  // FALLBACK
  console.log("❌ Falling back to unknown activity type");
  return (
    <div className="flex items-center space-x-4 p-3 sm:p-4 rounded-xl bg-gray-100/60">
      <div className="text-gray-600 text-sm">
        Unknown activity type: {event.event_type}
        <br />
        <pre className="text-xs mt-2 p-2 bg-gray-200 rounded overflow-auto">
          {JSON.stringify(event, null, 2)}
        </pre>
      </div>
      <div className="text-xs text-gray-500">{timeAgo}</div>
    </div>
  );
};