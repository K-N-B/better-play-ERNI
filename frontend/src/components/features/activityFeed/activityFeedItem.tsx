// src/components/features/activityFeed/activityFeedItem.tsx 
import React from 'react';
import type { ActivityEvent } from '../../../types/activity';
import clsx from 'clsx';
import { formatTimeAgo } from '../../../utils/timeFormat';
import { Swords, Trophy, Send } from 'lucide-react';

interface ActivityFeedItemProps {
  event: ActivityEvent;
}

// Puzzle-specific styles (for submissions)
const puzzleStyles: Record<string, { text: string; bg: string; avatarBg: string; avatarText: string }> = {
  Sudoku: { text: 'text-pink-600', bg: 'bg-pink-100/60', avatarBg: 'bg-pink-300', avatarText: 'text-pink-800' },
  Wordle: { text: 'text-emerald-600', bg: 'bg-emerald-100/60', avatarBg: 'bg-emerald-300', avatarText: 'text-emerald-800' },
  ERNIgram: { text: 'text-sky-600', bg: 'bg-sky-100/60', avatarBg: 'bg-sky-300', avatarText: 'text-sky-800' },
};

// Challenge event styles
const challengeStyles = {
  sent: { 
    text: 'text-orange-600', 
    bg: 'bg-orange-100/60', 
    icon: 'text-orange-500',
    avatarBg: 'bg-orange-300',
    avatarText: 'text-orange-800'
  },
  completed_won: { 
    text: 'text-green-600', 
    bg: 'bg-green-100/60', 
    icon: 'text-green-500',
    avatarBg: 'bg-green-300',
    avatarText: 'text-green-800'
  },
  completed_lost: { 
    text: 'text-red-600', 
    bg: 'bg-red-100/60', 
    icon: 'text-red-500',
    avatarBg: 'bg-red-300',
    avatarText: 'text-red-800'
  },
  completed_tie: { 
    text: 'text-purple-600', 
    bg: 'bg-purple-100/60', 
    icon: 'text-purple-500',
    avatarBg: 'bg-purple-300',
    avatarText: 'text-purple-800'
  },
};

// Helper: Render avatar with profile picture or initial
const UserAvatar: React.FC<{ 
  user: { username: string; profile_picture_url: string | null };
  styleClasses: { avatarBg: string; avatarText: string };
}> = ({ user, styleClasses }) => {
  const userInitial = user.username.charAt(0).toUpperCase();
  
  return (
    <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden">
      {user.profile_picture_url ? (
        <img
          src={user.profile_picture_url}
          alt={`${user.username} profile picture`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className={clsx(
          "w-full h-full flex items-center justify-center text-xl font-bold",
          styleClasses.avatarBg,
          styleClasses.avatarText
        )}>
          {userInitial}
        </div>
      )}
    </div>
  );
};

export const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({ event }) => {
  const timeAgo = formatTimeAgo(event.created_at);

  // SUBMISSION EVENT
  if (event.event_type === 'submission' && event.user && event.puzzle_name) {
    const styles = puzzleStyles[event.puzzle_name] || { 
      text: 'text-gray-600', 
      bg: 'bg-gray-100/60', 
      avatarBg: 'bg-gray-300', 
      avatarText: 'text-gray-800' 
    };

    return (
      <div className={clsx("flex items-start space-x-4 p-3 sm:p-4 rounded-xl relative", styles.bg)}>
        <UserAvatar user={event.user} styleClasses={styles} />
        
        <div className="flex-1 min-w-0">
          <div className="text-gray-700 text-sm sm:text-base leading-snug">
            <strong className="text-gray-900 font-semibold">{event.user.username}</strong>
            <span> just finished answering today's </span>
            <strong className={clsx("font-semibold", styles.text)}>{event.puzzle_name}</strong>
            <span> puzzle in </span>
            <strong className="text-gray-900 font-semibold">{event.difficulty}</strong>
            <span> mode in just </span>
            <strong className="text-gray-900 font-semibold">{event.time_in_minutes} minutes!</strong>
          </div>
          
          <div className="text-xs text-gray-500 mt-1">{timeAgo}</div>
        </div>
      </div>
    );
  }

  // CHALLENGE SENT EVENT
  if (event.event_type === 'challenge_sent' && event.challenger && event.recipient && event.puzzle_name) {
    const styles = challengeStyles.sent;

    return (
      <div className={clsx("flex items-start space-x-4 p-3 sm:p-4 rounded-xl relative", styles.bg)}>
        <div className="flex-shrink-0">
          <Send size={24} className={styles.icon} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-gray-700 text-sm sm:text-base leading-snug">
            <strong className="text-gray-900 font-semibold">{event.challenger.username}</strong>
            <span> challenged </span>
            <strong className="text-gray-900 font-semibold">{event.recipient.username}</strong>
            <span> to beat their </span>
            <strong className={clsx("font-semibold", styles.text)}>{event.puzzle_name}</strong>
            <span> score on </span>
            <strong className="text-gray-900 font-semibold">{event.difficulty}</strong>
            <span> difficulty!</span>
          </div>
          
          <div className="text-xs text-gray-500 mt-1">{timeAgo}</div>
        </div>
      </div>
    );
  }

  // CHALLENGE COMPLETED EVENT
  if (event.event_type === 'challenge_completed' && event.challenger && event.recipient && event.puzzle_name) {
    // Determine outcome
    let styles;
    let outcomeText;
    let Icon;

    if (!event.winner) {
      // Tie
      styles = challengeStyles.completed_tie;
      outcomeText = 'TIED with';
      Icon = Swords;
    } else if (event.winner.id === event.recipient.id) {
      // Recipient won
      styles = challengeStyles.completed_won;
      outcomeText = 'WON against';
      Icon = Trophy;
    } else {
      // Challenger won (recipient lost)
      styles = challengeStyles.completed_lost;
      outcomeText = 'LOST to';
      Icon = Swords;
    }

    return (
      <div className={clsx("flex items-start space-x-4 p-3 sm:p-4 rounded-xl relative", styles.bg)}>
        <div className="flex-shrink-0">
          <Icon size={24} className={styles.icon} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-gray-700 text-sm sm:text-base leading-snug">
            <strong className="text-gray-900 font-semibold">{event.recipient.username}</strong>
            <span> completed </span>
            <strong className="text-gray-900 font-semibold">{event.challenger.username}</strong>
            <span>'s </span>
            <strong className={clsx("font-semibold", styles.text)}>{event.puzzle_name}</strong>
            <span> challenge and </span>
            <strong className={clsx("font-bold", styles.text)}>{outcomeText}</strong>
            <span> them!</span>
          </div>
          
          <div className="text-xs text-gray-500 mt-1">{timeAgo}</div>
        </div>
      </div>
    );
  }

  // Fallback for unrecognized event types
  return (
    <div className="flex items-center space-x-4 p-3 sm:p-4 rounded-xl bg-gray-100/60">
      <div className="text-gray-600 text-sm">Unknown activity type</div>
      <div className="text-xs text-gray-500">{timeAgo}</div>
    </div>
  );
};