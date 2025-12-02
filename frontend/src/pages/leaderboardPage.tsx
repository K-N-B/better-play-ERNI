import { useState, useCallback } from "react";
import { useApi } from "../hooks/useApi";
import { getLeaderboard } from "../api/leaderboardService";
import { LeaderboardCard } from "../components/features/leaderboard/leaderboardCard";
import { TabButton } from "../components/ui/tabButton";
import type { LeaderboardPeriod, LeaderboardData } from "../types/leaderboard";

// Helper component for the filter tabs
const PeriodFilters: React.FC<{
  selectedPeriod: LeaderboardPeriod;
  onPeriodChange: (period: LeaderboardPeriod) => void;
}> = ({ selectedPeriod, onPeriodChange }) => {
  const periods: LeaderboardPeriod[] = ["daily", "weekly", "monthly", "all_time"];
  return (
    // Added 'flex-wrap' so buttons don't overflow on very small phones
    <div className="flex flex-wrap gap-2 p-1 rounded-lg mb-4 justify-center">
      {periods.map((p) => (
        <TabButton
          key={p}
          label={p === 'all_time' ? 'All-Time' : p.charAt(0).toUpperCase() + p.slice(1)}
          isActive={selectedPeriod === p}
          onClick={() => onPeriodChange(p)}
        />
      ))}
    </div>
  );
};

export const LeaderboardPage = () => {
  const [individualPeriod, setIndividualPeriod] = useState<LeaderboardPeriod>("weekly");
  const [departmentPeriod, setDepartmentPeriod] = useState<LeaderboardPeriod>("weekly");

  const fetchIndividualLeaderboard = useCallback(
    () => getLeaderboard(individualPeriod, 'individual'),
    [individualPeriod]
  );
  const {
    data: individualData,
    loading: loadingIndividual,
    error: errorIndividual,
  } = useApi(fetchIndividualLeaderboard);

  const fetchDepartmentLeaderboard = useCallback(
    () => getLeaderboard(departmentPeriod, 'department'),
    [departmentPeriod]
  );
  const {
    data: departmentData,
    loading: loadingDepartment,
    error: errorDepartment,
  } = useApi(fetchDepartmentLeaderboard);

  const individualTitle = `${individualPeriod === 'all_time' ? 'All-Time' : individualPeriod.charAt(0).toUpperCase() + individualPeriod.slice(1)} Individual`;
  const departmentTitle = `${departmentPeriod === 'all_time' ? 'All-Time' : departmentPeriod.charAt(0).toUpperCase() + departmentPeriod.slice(1)} Department`;

  return (
    <div className="container mx-auto px-4 pb-6">
      {/* MAIN GRID CONTAINER 
        - Mobile: h-auto (Let page grow naturally)
        - Desktop (lg): h-[calc...] (Fix height to fit screen for dashboard feel)
        - Grid: 1 col on mobile, 2 cols on Large screens
      */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 h-auto lg:h-[calc(100vh-10rem)]">
        
        {/* --- CARD 1: INDIVIDUAL --- */}
        {/* Height Logic:
           - h-[65vh]: On mobile, makes card tall enough to see data, but short enough to see the next card below.
           - lg:h-full: On desktop, stretch to fill the grid row.
        */}
        <div className="flex flex-col bg-slate-50 rounded-3xl lg:rounded-4xl p-4 lg:p-6 shadow-md overflow-hidden h-[65vh] lg:h-full">
          <h2 className="text-xl font-semibold mb-3 text-center text-gray-700">Individual Rankings</h2>
          <PeriodFilters
            selectedPeriod={individualPeriod}
            onPeriodChange={setIndividualPeriod}
          />
          
          <div className="grow overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-2">
            <LeaderboardCard
              title={individualTitle}
              data={individualData as LeaderboardData | null}
              type="individual"
              loading={loadingIndividual}
              error={errorIndividual}
            />
          </div>
        </div>

        {/* --- CARD 2: DEPARTMENT --- */}
        <div className="flex flex-col bg-slate-50 rounded-3xl lg:rounded-4xl p-4 lg:p-6 shadow-md overflow-hidden h-[65vh] lg:h-full">
          <h2 className="text-xl font-semibold mb-3 text-center text-gray-700">Department Rankings</h2>
          <PeriodFilters
            selectedPeriod={departmentPeriod}
            onPeriodChange={setDepartmentPeriod}
          />
          
          <div className="grow overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-2">
            <LeaderboardCard
              title={departmentTitle}
              data={departmentData as LeaderboardData | null}
              type="department"
              loading={loadingDepartment}
              error={errorDepartment}
            />
          </div>
        </div>

      </div>
    </div>
  );
};