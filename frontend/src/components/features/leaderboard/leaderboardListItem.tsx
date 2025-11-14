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
  let name = 'N/A';
  let profileImageUrl: string | null = null;
  let entryId: number | undefined;
  
  if (type === 'individual') {
    const individualEntry = entry as IndividualScoreEntry;
    name = individualEntry.user?.username ?? 'N/A';
    profileImageUrl = individualEntry.user?.profile_picture_url ?? null;
    entryId = individualEntry.user?.id;
  } else {
    const deptEntry = entry as DepartmentScoreEntry;
    name = deptEntry.department?.name ?? 'N/A';
    entryId = deptEntry.department?.id;
  }

  const score = entry.score;
  const rankColor = rankColors[rank] || "text-primary";
  const userInitial = name.charAt(0).toUpperCase();
  const key = `${type}-${entryId}-${rank}`;

  return (
    <li
      key={key}
      className="flex justify-between items-center py-2 text-base sm:text-lg w-full gap-4"
    >
      {/* Left side: Rank + Profile Picture (if individual) + Name */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Rank */}
        <span className={clsx("font-bold text-lg sm:text-xl w-6 text-left shrink-0", rankColor)}>
          {rank}
        </span>
        
        {/* Profile Picture - Only for individual leaderboards */}
        {type === 'individual' && (
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={`${name} profile picture`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-sky-400 flex items-center justify-center text-white text-sm font-bold">
                {userInitial}
              </div>
            )}
          </div>
        )}
        
        {/* Name */}
        <span className="text-primary-800 font-medium text-base sm:text-lg truncate">
          {name}
        </span>
      </div>

      {/* Right side: Score */}
      <div className="text-primary-700 text-sm sm:text-base xl:text-lg italic shrink-0">
        <span className="font-semibold">{score}</span> pts
      </div>
    </li>
  );
};