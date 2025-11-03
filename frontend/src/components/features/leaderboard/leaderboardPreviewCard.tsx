import React from "react";
import { useApi } from "../../../hooks/useApi";
import { getLeaderboard } from "../../../api/leaderboardService";
import { LoadingSpinner } from "../../ui/loadingSpinner";
import { LeaderboardList } from "./leaderboardList";
import type { IndividualScoreEntry } from "../../../types/leaderboard";
import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";

const PREVIEW_LIMIT = 10;

export const LeaderboardPreviewCard = () => {
  // ✅ Changed from "daily" to "all_time"
  const fetchPreviewData = React.useCallback(
    () => getLeaderboard("all_time", "individual"),
    []
  );
  const { data, loading, error } = useApi(fetchPreviewData);

  console.log("Leaderboard API response:", data);

  // Safely extract array
  const entries: IndividualScoreEntry[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.results)
    ? (data as any).results
    : Array.isArray((data as any)?.data)
    ? (data as any).data
    : [];

  const previewData = entries.slice(0, PREVIEW_LIMIT);

  return (
    <div className="bg-white p-6 rounded-4xl shadow-md border border-gray-100 flex flex-col h-full">
      {/* ✅ Removed dropdown button, simplified header */}
      <div className="flex justify-between items-center flex-shrink-0 mb-3">
        <h3 className="text-xl font-semibold flex items-center space-x-3">
          <Trophy size={22} strokeWidth={2.5} />
          <div className="text-xl font-semibold text-black">
            Leaderboards
          </div>
        </h3>
      </div>

      <div className="flex-grow overflow-y-auto">
        {loading && (
          <div className="text-center py-4">
            <LoadingSpinner />
          </div>
        )}
        {error && (
          <p className="text-center py-4 text-red-600">
            Could not load leaderboard.
          </p>
        )}
        {!loading && !error && (
          <LeaderboardList
            data={previewData}
            type="individual"
            offsetRank={1}
          />
        )}
      </div>

      <Link
        to="/leaderboards"
        className="block text-center text-sm text-primary mt-4 hover:underline flex-shrink-0"
      >
        View All Rankings
      </Link>
    </div>
  );
};