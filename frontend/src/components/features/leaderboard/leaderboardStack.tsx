import React from 'react';
import type {
  IndividualScoreEntry,
  DepartmentScoreEntry,
  LeaderboardType,
} from '../../../types/leaderboard';
import { LeaderboardListItem } from './leaderboardListItem'; // We can reuse the list item!
import { Crown } from 'lucide-react';
import clsx from 'clsx';

type LeaderboardEntry = IndividualScoreEntry | DepartmentScoreEntry;

interface TopThreeProps {
  topThree: LeaderboardEntry[];
  type: LeaderboardType;
}

// Define styles for each rank
const rankStyles = [
  // Rank 1 (index 0)
  {
    bg: 'bg-amber-200',
    iconColor: 'text-yellow-500 fill-yellow-400',
    textColor: 'text-yellow-700',
  },
  // Rank 2 (index 1)
  {
    bg: 'bg-gray-200',
    iconColor: 'text-gray-500 fill-gray-400',
    textColor: 'text-gray-700',
  },
  // Rank 3 (index 2)
  {
    bg: 'bg-amber-100', // Bronze/Amber color
    iconColor: 'text-amber-600 fill-amber-500',
    textColor: 'text-amber-700',
  },
];

export const LeaderboardStack: React.FC<TopThreeProps> = ({
  topThree,
  type,
}) => {
  return (
    <div className="space-y-2">
      {topThree.map((entry, index) => {
        const rank = index + 1;
        const styles = rankStyles[index] || {
          bg: 'bg-gray-50',
          iconColor: 'text-gray-400',
          textColor: 'text-gray-600',
        };
        const name =
          type === 'individual'
            ? ((entry as IndividualScoreEntry).user?.username ?? 'N/A')
            : ((entry as DepartmentScoreEntry).department?.name ?? 'N/A');
        const entryId =
          type === 'individual'
            ? (entry as IndividualScoreEntry).user?.id
            : (entry as DepartmentScoreEntry).department?.id;

        return (
          <div
            key={`${type}-${entryId}-${rank}`}
            className={clsx(
              'flex items-center gap-3 p-3 rounded-lg ',
              styles.bg,
            )}
          >
            {/* Crown + Rank */}
            <div className="flex flex-col items-center w-8">
              <Crown size={20} className={clsx(styles.iconColor)} />
              <span className={clsx('font-bold text-lg', styles.textColor)}>
                {rank}
              </span>
            </div>

            {/* Name and Score (flex-grow to push score to the right) */}
            <div className="flex-grow flex justify-between items-center">
              <span className="text-primary-800 font-medium text-base sm:text-lg text-wrap">
                {name}
              </span>
              <div className="text-primary-700 text-sm sm:text-base xl:text-lg italic">
                <span className="font-semibold">{entry.score}</span> pts
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
