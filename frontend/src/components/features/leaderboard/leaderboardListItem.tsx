// /src/components/features/leaderboard/leaderboardListItem.tsx
import React from 'react';
import type { IndividualScoreEntry, DepartmentScoreEntry, LeaderboardType } from '../../../types/leaderboard';
import clsx from 'clsx';

type LeaderboardEntry = IndividualScoreEntry | DepartmentScoreEntry;

interface LeaderboardListItemProps {
  entry: LeaderboardEntry;
  rank: number;
  type: LeaderboardType;
}

const rankColors: Record<number, string> = {
  1: "text-yellow-500",
  2: "text-gray-500",
  3: "text-amber-700",
};

export const LeaderboardListItem: React.FC<LeaderboardListItemProps> = ({ entry, rank, type }) => {
  const name = type === 'individual'
                 ? (entry as IndividualScoreEntry).user?.username ?? 'N/A'
                 : (entry as DepartmentScoreEntry).department?.name ?? 'N/A';

  const score = entry.score;
  const rankColor = rankColors[rank] || "text-primary";

  const entryId = type === 'individual'
                  ? (entry as IndividualScoreEntry).user?.id
                  : (entry as DepartmentScoreEntry).department?.id;
  const key = `${type}-${entryId}-${rank}`;

  return (
    <li
      key={key}
      // Add gap-4 for spacing between name and score
      className="flex justify-between items-center py-2 text-base sm:text-lg w-full gap-4"
    >
      {/* Left side: Rank + Name */}
      {/* Add min-w-0 to allow this flex item to shrink and truncate its children */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Rank (no change) */}
        <span className={clsx("font-bold text-lg sm:text-xl w-6 text-left", rankColor)}>
          {rank}
        </span>
        {/* Name: Replace 'text-clip' with 'truncate' to add ellipsis */}
        <span className="text-primary-800 font-medium text-base sm:text-lg truncate">
          {name}
        </span>
      </div>

      {/* Right side: Score */}
      {/* Add flex-shrink-0 to prevent this from shrinking */}
      <div className="text-primary-700 text-sm sm:text-base xl:text-lg italic flex-shrink-0">
        <span className="font-semibold">{score}</span> pts
      </div>
    </li>
  );
};

// If using default exports:
// export default LeaderboardListItem;