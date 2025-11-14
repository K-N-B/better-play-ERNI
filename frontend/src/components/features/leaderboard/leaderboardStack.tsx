import React from 'react';
import type { IndividualScoreEntry, DepartmentScoreEntry, LeaderboardType } from '../../../types/leaderboard';
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
    bg: 'bg-amber-100',
    iconColor: 'text-amber-600 fill-amber-500',
    textColor: 'text-amber-700',
  },
];

export const LeaderboardStack: React.FC<TopThreeProps> = ({ topThree, type }) => {
  return (
    <div className="space-y-2">
      {topThree.map((entry, index) => {
        const rank = index + 1;
        const styles = rankStyles[index] || { bg: 'bg-gray-50', iconColor: 'text-gray-400', textColor: 'text-gray-600' };
        
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
        
        const userInitial = name.charAt(0).toUpperCase();
        
        return (
          <div
            key={`${type}-${entryId}-${rank}`}
            className={clsx("flex items-center gap-3 p-3 rounded-lg", styles.bg)}
          >
            {/* Crown + Rank */}
            <div className="flex flex-col items-center w-8 shrink-0">
              <Crown size={20} className={clsx(styles.iconColor)} />
              <span className={clsx("font-bold text-lg", styles.textColor)}>
                {rank}
              </span>
            </div>
            
            {/* Profile Picture/Avatar - Only for individual leaderboards */}
            {type === 'individual' && (
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={`${name} profile picture`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-sky-400 flex items-center justify-center text-white text-lg font-bold">
                    {userInitial}
                  </div>
                )}
              </div>
            )}
            
            {/* Name and Score */}
            <div className="flex-grow flex justify-between items-center min-w-0">
               <span className="text-primary-800 font-medium text-base sm:text-lg truncate">{name}</span>
               <div className="text-primary-700 text-sm sm:text-base xl:text-lg italic shrink-0 ml-2">
                 <span className="font-semibold">{entry.score}</span> pts
               </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};