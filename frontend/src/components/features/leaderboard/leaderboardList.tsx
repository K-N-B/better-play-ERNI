import type { IndividualScoreEntry, DepartmentScoreEntry, LeaderboardType } from '../../../types/leaderboard';
import { LeaderboardListItem } from './leaderboardListItem';
type LeaderboardEntry = IndividualScoreEntry | DepartmentScoreEntry;

interface LeaderboardListProps {
  data: LeaderboardEntry[];
  type: LeaderboardType;
  offsetRank?: number;
}

export const LeaderboardList: React.FC<LeaderboardListProps> = ({ data, type, offsetRank = 1 }) => {

  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 py-10">No further rankings available.</div>;
  }

  return (
    <div className="flex-grow overflow-y-auto">
      <ul className="divide-y divide-gray-200">
        {data.map((entry, index) => {
          const rank = index + offsetRank;
          const entryId = type === 'individual'
                          ? (entry as IndividualScoreEntry).user?.id
                          : (entry as DepartmentScoreEntry).department?.id;
          const key = `${type}-${entryId}-${rank}`;

          return (
            // --- UPDATE COMPONENT NAME HERE ---
            <LeaderboardListItem
              key={key}
              entry={entry}
              rank={rank}
              type={type}
            />
            // --- END UPDATE ---
          );
        })}
      </ul>
    </div>
  );
};