import { useState, useCallback } from "react";
import { useApi } from "../hooks/useApi";
import { getLeaderboard } from "../api/leaderboardService";
import { LeaderboardCard } from "../components/features/leaderboard/leaderboardCard";
import { TabButton } from "../components/ui/tabButton";
import type { LeaderboardPeriod } from "../types/leaderboard";

export const LeaderboardPage = () => {
  const [period, setPeriod] = useState<LeaderboardPeriod>("weekly");

  // --- Fetch data for the SELECTED period (always individual) ---
  const fetchSelectedLeaderboard = useCallback(
    () => getLeaderboard(period, "individual"),
    [period]
  );
  const {
    data: selectedData,
    loading: loadingSelected,
    error: errorSelected,
  } = useApi(fetchSelectedLeaderboard);

  // --- Fetch data for ALL-TIME (always individual) ---
  const fetchAllTimeIndividual = useCallback(
    () => getLeaderboard("alltime", "individual"),
    []
  );
  const {
    data: allTimeData,
    loading: loadingAllTime,
    error: errorAllTime,
  } = useApi(fetchAllTimeIndividual);

  const selectedTitle = `${period.charAt(0).toUpperCase() + period.slice(1)} Individual`;

  return (
    <div className="container mx-auto px-4 py-8 h-full">
      <h1 className="text-3xl font-bold mb-6 text-center">Leaderboards</h1>

      {/* Period Filter Only */}
      <div className="mb-6 flex justify-center">
        <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg shadow-inner">
          {(
            ["daily", "weekly", "monthly", "alltime"] as LeaderboardPeriod[]
          ).map((p) => (
            <TabButton
              key={p}
              label={p.charAt(0).toUpperCase() + p.slice(1)}
              isActive={period === p}
              onClick={() => setPeriod(p)}
            />
          ))}
        </div>
      </div>

      {/* --- Leaderboard Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 h-[calc(100vh-15rem)] gap-8">
        <LeaderboardCard
          title={selectedTitle}
          data={selectedData}
          type="individual"
          loading={loadingSelected}
          error={errorSelected}
        />
        <LeaderboardCard
          title="All-Time Individual"
          data={allTimeData}
          type="individual"
          loading={loadingAllTime}
          error={errorAllTime}
        />
      </div>
    </div>
  );
};
