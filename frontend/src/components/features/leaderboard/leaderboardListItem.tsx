// /src/components/features/LeaderboardListItem.tsx
import React from 'react';
import type { IndividualScoreEntry, DepartmentScoreEntry, LeaderboardType } from '../../../types/leaderboard';
import clsx from 'clsx';

type LeaderboardEntry = IndividualScoreEntry | DepartmentScoreEntry;

// Optional: Rename the props interface as well for consistency
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

// --- RENAME THE FUNCTION ---
export const LeaderboardListItem: React.FC<LeaderboardListItemProps> = ({ entry, rank, type }) => {
// --- END RENAME ---

  // Determine name based on the type and data structure
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
      // --- THIS IS THE FIX ---
      // Adjusted text size to be smaller by default, and larger (text-lg) on sm screens
      className="flex justify-between items-center py-2 text-base sm:text-lg"
    >
      {/* Left side: Rank + Name */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Adjusted text size */}
        <span className={clsx("font-bold text-lg sm:text-xl w-6 text-right text-wrap", rankColor)}>
          {rank}
        </span>
        {/* Adjusted text size */}
        <span className="text-primary-800 font-medium text-base sm:text-lg text-wrap">{name}</span>
      </div>

      {/* Right side: Score */}
      {/* Adjusted text size */}
      <div className="text-primary-700 text-sm sm:text-base xl:text-lg italic">
        <span className="font-semibold">{score}</span> pts
      </div>
      {/* --- END FIX --- */}
    </li>
  );
};

// If using default exports, update it here too:
// export default LeaderboardListItem;