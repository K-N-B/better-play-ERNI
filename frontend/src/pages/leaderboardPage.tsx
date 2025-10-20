import { useState, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { getLeaderboard } from '../api/leaderboardService';
import { LeaderboardCard } from '../components/features/leaderboardCard';
import { TabButton } from '../components/ui/tabButton'; // Assuming you have this
import type { LeaderboardPeriod, LeaderboardType } from '../types/leaderboard';
import clsx from 'clsx';

export const LeaderboardPage = () => {
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const [type, setType] = useState<LeaderboardType>('individual');

  // --- Fetch data for the SELECTED period/type ---
  const fetchSelectedLeaderboard = useCallback(
      () => getLeaderboard(period, type),
      [period, type]
  );
  const { data: selectedData, loading: loadingSelected, error: errorSelected } = useApi(fetchSelectedLeaderboard);

  // --- Fetch data for ALL-TIME (always individual and alltime) ---
  const fetchAllTimeIndividual = useCallback(() => getLeaderboard('alltime', 'individual'), []);
  const { data: allTimeData, loading: loadingAllTime, error: errorAllTime } = useApi(fetchAllTimeIndividual);

  // Determine title for the selected card
  const selectedTitle = `${period.charAt(0).toUpperCase() + period.slice(1)} ${type === 'department' ? 'Department' : 'Individual'}`;
  console.log(`[LeaderboardPage] Rendering cards. Selected Type: ${type}, Selected Data:`, selectedData);
  console.log(`[LeaderboardPage] All-Time Type: individual, All-Time Data:`, allTimeData);
  return (
    <div className="container mx-auto px-4 py-8 h-full"> {/* Ensure container takes height */}
      <h1 className="text-3xl font-bold mb-6 text-center">Leaderboards</h1>

      {/* --- Filters --- */}
      <div className="mb-6 flex flex-col items-center space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-8">
        {/* Period Filter */}
        <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg shadow-inner">
          {(['daily', 'weekly', 'monthly', 'alltime'] as LeaderboardPeriod[]).map(p => (
            <TabButton
              key={p}
              label={p.charAt(0).toUpperCase() + p.slice(1)}
              isActive={period === p}
              onClick={() => setPeriod(p)}
            />
          ))}
        </div>
        {/* Type Filter */}
        <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg shadow-inner">
          {(['individual', 'department'] as LeaderboardType[]).map(t => (
            <TabButton
              key={t}
              label={t === 'department' ? 'Department' : 'Individual'}
              isActive={type === t}
              onClick={() => setType(t)}
            />
          ))}
        </div>
      </div>

      {/* --- Leaderboard Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 h-[calc(100vh-15rem)] gap-8"> {/* Adjust height calculation */}
        {/* Selected Period Card */}
        <LeaderboardCard
          title={selectedTitle}
          data={selectedData}
          type={type} // Pass the selected type
          loading={loadingSelected}
          error={errorSelected}
        />

        {/* All-Time Card (Always Individual) */}
        <LeaderboardCard
          title="All-Time Individual"
          data={allTimeData}
          type="individual" // Always individual for this card
          loading={loadingAllTime}
          error={errorAllTime}
        />
      </div>
    </div>
  );
}