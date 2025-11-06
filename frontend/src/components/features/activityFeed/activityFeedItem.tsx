// /src/components/features/ActivityFeedItem.tsx

import React from 'react';
import type { ActivityEvent } from '../../../types/activity'; // Import the correct type
import clsx from 'clsx'; // For conditional styling

interface ActivityFeedItemProps {
  event: ActivityEvent;
}

// Helper to get Tailwind CSS classes based on puzzle name
const puzzleStyles: Record<
  ActivityEvent['puzzle_name'],
  { text: string; bg: string; avatarBg: string; avatarText: string }
> = {
  Sudoku: {
    text: 'text-pink-600',
    bg: 'bg-pink-100/60',
    avatarBg: 'bg-pink-300',
    avatarText: 'text-pink-800',
  },
  Wordle: {
    text: 'text-emerald-600',
    bg: 'bg-emerald-100/60',
    avatarBg: 'bg-emerald-300',
    avatarText: 'text-emerald-800',
  },
  ERNIgram: {
    text: 'text-sky-600',
    bg: 'bg-sky-100/60',
    avatarBg: 'bg-sky-300',
    avatarText: 'text-sky-800',
  },
};

export const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({
  event,
}) => {
  // Get the specific styles for this puzzle type
  const styles = puzzleStyles[event.puzzle_name] || {
    text: 'text-gray-600',
    bg: 'bg-gray-100/60',
    avatarBg: 'bg-gray-300',
    avatarText: 'text-gray-800',
  };

  // Get the user's initial for the avatar
  const userInitial = event.user.username?.charAt(0).toUpperCase() || '?';

  return (
    // Main container with light background and rounded corners
    <div
      className={clsx(
        'flex items-center space-x-4 p-3 sm:p-4 rounded-xl',
        styles.bg,
      )}
    >
      {/* Avatar Circle */}
      <div
        className={clsx(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold',
          styles.avatarBg,
          styles.avatarText,
        )}
      >
        {userInitial}
      </div>

      {/* Message Content */}
      <div className="text-gray-700 text-sm sm:text-base leading-snug">
        <strong className="text-gray-900 font-semibold">
          {event.user.username}
        </strong>
        <span> just finished answering the today's </span>
        <strong className={clsx('font-semibold', styles.text)}>
          {event.puzzle_name}
        </strong>
        <span> puzzle in </span>
        <strong className="text-gray-900 font-semibold">
          {event.difficulty}
        </strong>
        <span> mode in just </span>
        <strong className="text-gray-900 font-semibold">
          {event.time_in_minutes} minutes!
        </strong>
        {/* Optional: Add time ago if needed */}
        {/* <span className="text-xs text-gray-400 ml-2">{timeAgo(event.created_at)}</span> */}
      </div>
    </div>
  );
};

// If using default exports:
// export
