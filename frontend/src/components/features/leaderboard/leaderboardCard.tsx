import type {
  LeaderboardData,
  LeaderboardType,
} from "../../../types/leaderboard";
import { LeaderboardPodium } from "./leaderboardPodium";
import { LeaderboardList } from "./leaderboardList";
import { LoadingSpinner } from "../../ui/loadingSpinner";
import { LeaderboardStack } from "./leaderboardStack";

interface LeaderboardCardProps {
  title: string;
  data: LeaderboardData | null;
  type: LeaderboardType;
  loading: boolean;
  error: Error | null;
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  data,
  type,
  loading,
  error,
}) => {
  // ✅ Data Normalization
  const leaderboardArray = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.leaderboard)
    ? (data as any).leaderboard
    : [];

  const topThree = leaderboardArray.slice(0, 3);
  const restOfList = leaderboardArray.slice(3);

  return (
    // Added 'w-full' to ensure it fills the grid column
    <div className="flex flex-col h-full w-full">
      
      {/* Loading State */}
      {loading && (
        <div className="grow flex flex-col items-center justify-center min-h-[200px] gap-2 text-gray-400">
          <LoadingSpinner />
          <p className="text-sm animate-pulse">Fetching rankings...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="grow flex flex-col items-center justify-center min-h-[200px] text-red-500 gap-2">
          <p className="font-semibold">Unable to load leaderboard</p>
          <p className="text-xs text-red-400">Please try again later</p>
        </div>
      )}

      {/* Success State */}
      {!loading && !error && leaderboardArray.length > 0 && (
        // Added 'gap-6' to separate Podium from List nicely
        <div className="flex flex-col gap-6 pb-4">
          
          {/* 1. TOP 3 VIEW */}
          <div>
            {/* Desktop: Standard Podium (Hidden on mobile) */}
            <div className="hidden md:block">
              <LeaderboardPodium topThree={topThree} type={type} />
            </div>

            {/* Mobile: Compact Stack (Hidden on desktop) */}
            <div className="block md:hidden">
              <LeaderboardStack topThree={topThree} type={type} />
            </div>
          </div>

          {/* 2. REMAINING LIST (Ranks 4+) */}
          {/* Only render if there are actually users below rank 3 */}
          {restOfList.length > 0 && (
            <div className="px-1">
              <LeaderboardList data={restOfList} type={type} offsetRank={4} />
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && leaderboardArray.length === 0 && (
        <div className="grow flex flex-col items-center justify-center min-h-[200px] text-gray-400">
          <p className="text-lg font-semibold">No rankings yet</p>
          <p className="text-sm">Be the first to play!</p>
        </div>
      )}
    </div>
  );
};