import type { IndividualScoreEntry, DepartmentScoreEntry, LeaderboardType } from '../../types/leaderboard';
import clsx from 'clsx';

type LeaderboardEntry = IndividualScoreEntry | DepartmentScoreEntry;

interface LeaderboardListProps {
  data: LeaderboardEntry[]; // Data starting from rank 4
  type: LeaderboardType;
  offsetRank?: number; // Starting rank number (e.g., 4)
}

// Map ranks to text colors
const rankColors: Record<number, string> = {
  1: "text-yellow-500",
  2: "text-gray-500",
  3: "text-amber-700",
};

export const LeaderboardList: React.FC<LeaderboardListProps> = ({ data, type, offsetRank = 1 }) => {

  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 py-10">No further rankings available.</div>;
  }

  return (
    <div className="flex-grow overflow-y-auto px-2"> {/* Added padding */}
      <ul className="divide-y divide-gray-200">
        {data.map((entry, index) => {
          const rank = index + offsetRank;
          const name = type === 'individual' ? (entry as IndividualScoreEntry).user.username : (entry as DepartmentScoreEntry).department.name;
          const score = entry.score;
          const rankColor = rankColors[rank] || "text-primary"; // Default color for rank 4+

          return (
            <li
              key={type === 'individual' ? (entry as IndividualScoreEntry).user.id : (entry as DepartmentScoreEntry).department.id}
              className="flex justify-between items-center py-3 text-lg"
            >
              {/* Left side: Rank + Name */}
              <div className="flex items-center gap-3"> {/* Increased gap */}
                <span className={clsx("font-bold text-xl w-6 text-right", rankColor)}> {/* Width for alignment */}
                  {rank}
                </span>
                <span className="text-primary-800 text-base">{name}</span> {/* Adjusted text size */}
              </div>

              {/* Right side: Score */}
              <div className="text-primary-700 text-lg italic"> {/* Adjusted text size */}
                <span className="font-semibold">{score}</span> pts
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};