import React from 'react';
import type { IndividualScoreEntry } from '../../../types/leaderboard';
import clsx from 'clsx';

interface LeaderboardListItemProps {
  entry: IndividualScoreEntry;
  rank: number;
}

const rankColors: Record<number, string> = {
  1: "text-yellow-500",
  2: "text-gray-500",
  3: "text-amber-700",
};

export const LeaderboardListItem: React.FC<LeaderboardListItemProps> = ({ entry, rank }) => {
  const name = entry.user?.username ?? 'N/A';
  const score = entry.score;
  const rankColor = rankColors[rank] || "text-primary";

  return (
    <li className="flex justify-between items-center py-2 text-lg">
      <div className="flex items-center gap-3">
        <span className={clsx("font-bold text-xl w-6 text-right", rankColor)}>{rank}</span>
        <span className="text-primary-800 font-medium text-lg">{name}</span>
      </div>
      <div className="text-primary-700 text-lg italic">
        <span className="font-semibold">{score}</span> pts
      </div>
    </li>
  );
};
