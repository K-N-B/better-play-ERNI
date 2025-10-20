import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { getLeaderboard } from '../api/leaderboardService';
import { LoadingSpinner } from '../components/ui/loadingSpinner';
import type { LeaderboardData, LeaderboardPeriod, LeaderboardType, IndividualScoreEntry, DepartmentScoreEntry } from '../types/leaderboard'; // Updated import name
import { TabButton } from '../components/ui/tabButton';
import clsx from 'clsx';

// ... (TabButton component remains the same)

export const LeaderboardPage = () => {
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const [type, setType] = useState<LeaderboardType>('individual'); // Default type

  const fetchLeaderboardData = React.useCallback(
      () => getLeaderboard(period, type),
      [period, type]
  );
  const { data: leaderboardData, loading, error } = useApi(fetchLeaderboardData);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Leaderboards</h1>

      {/* --- Filters --- */}
      <div className="mb-6 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-8">
        {/* Period Filter (no change) */}
        {/* ... */}
        {/* Type Filter (Updated labels/values) */}
        <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg">
          {(['individual', 'department'] as LeaderboardType[]).map(t => ( // Changed 'team' to 'department'
            <TabButton
              key={t}
              label={t === 'department' ? 'Department' : 'Individual'} // Updated Label
              isActive={type === t}
              onClick={() => setType(t)}
            />
          ))}
        </div>
      </div>

      {/* --- Leaderboard Table --- */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading && <div className="p-10 text-center"><LoadingSpinner /></div>}
        {error && <p className="p-10 text-center text-red-600">Failed to load leaderboard.</p>}
        {!loading && !error && leaderboardData && leaderboardData.length > 0 && (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Rank</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {/* Updated Header */}
                  {type === 'individual' ? 'Player' : 'Department'}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboardData.map((entry, index) => {
                

                // Check if department exists before accessing name (temporary fix/check)
                const departmentName = (type === 'department' && (entry as DepartmentScoreEntry).department)
                                        ? (entry as DepartmentScoreEntry).department.name
                                        : 'N/A';
                const userName = (type === 'individual' && (entry as IndividualScoreEntry).user)
                                  ? (entry as IndividualScoreEntry).user.username
                                  : 'N/A';
                const entryId = type === 'individual'
                                ? (entry as IndividualScoreEntry).user?.id
                                : (entry as DepartmentScoreEntry).department?.id;

                // Use a unique key, even if ID is missing during debug
                const key = `${type}-${entryId || index}`;


                return (
                  <tr key={key}> {/* Use the generated key */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {type === 'individual' ? userName : departmentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-semibold">{entry.score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && !error && (!leaderboardData || leaderboardData.length === 0) && (
          <p className="p-10 text-center text-gray-500">No data available for this period.</p>
        )}
      </div>
    </div>
  );
}