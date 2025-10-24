import type {
  LeaderboardData,
  LeaderboardType,
} from "../../../types/leaderboard";
import { LeaderboardPodium } from "./leaderboardPodium";
import { LeaderboardList } from "./leaderboardList";
import { LoadingSpinner } from "../../ui/loadingSpinner";

interface LeaderboardCardProps {
  title: string; // e.g., "Weekly Individual", "All-Time Department"
  data: LeaderboardData | null;
  type: LeaderboardType;
  loading: boolean;
  error: Error | null;
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  title,
  data,
  type,
  loading,
  error,
}) => {
  console.log(
    `[LeaderboardCard] Received props for "${title}". Type: ${type}, Data:`,
    data
  );

  // ✅ Ensure data is always an array (to prevent "slice is not a function" errors)
  const leaderboardArray = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.leaderboard)
    ? (data as any).leaderboard
    : [];

  const topThree = leaderboardArray.slice(0, 3);
  const restOfList = leaderboardArray.slice(3);

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex justify-start items-center mb-4">
        <div className="text-xl font-bold text-primary py-1">{title}</div>
      </div>

      {/* Content */}
      {loading && (
        <div className="flex-grow flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
      {error && (
        <p className="flex-grow flex items-center justify-center text-red-600">
          Failed to load data.
        </p>
      )}

      {!loading && !error && leaderboardArray.length > 0 && (
        <>
          {/* Podium for Top 3 */}
          <LeaderboardPodium topThree={topThree} type={type} />

          {/* Divider */}
          <hr className="my-4 border-gray-300" />

          {/* List/Table for Ranks 4+ */}
          <LeaderboardList data={restOfList} type={type} offsetRank={4} />
        </>
      )}

      {!loading && !error && leaderboardArray.length === 0 && (
        <p className="flex-grow flex items-center justify-center text-gray-500">
          No data available.
        </p>
      )}
    </div>
  );
};
