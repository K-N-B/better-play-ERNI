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
  const periods: LeaderboardPeriod[] = ["daily", "weekly", "monthly", "all_time"]; // Corrected all_time value
  return (
    <div className="flex space-x-2 p-1 rounded-lg mb-4 justify-center">
      {periods.map((p) => (
        <TabButton
          key={p}
          // Correct label generation for all_time
          label={p === 'all_time' ? 'All-Time' : p.charAt(0).toUpperCase() + p.slice(1)}
          isActive={selectedPeriod === p}
          onClick={() => onPeriodChange(p)}
        />
      ))}
    </div>
  );
};


export const LeaderboardPage = () => { // Use default export if needed
  // --- State for each leaderboard's period ---
  const [individualPeriod, setIndividualPeriod] = useState<LeaderboardPeriod>("weekly");
  const [departmentPeriod, setDepartmentPeriod] = useState<LeaderboardPeriod>("weekly");

  // --- Fetch Individual Leaderboard Data ---
  const fetchIndividualLeaderboard = useCallback(
    () => getLeaderboard(individualPeriod, 'individual'),
    [individualPeriod] // Re-fetch only when individualPeriod changes
  );
  const {
    data: individualData,
    loading: loadingIndividual,
    error: errorIndividual,
  } = useApi(fetchIndividualLeaderboard);

  // --- Fetch Department Leaderboard Data ---
  const fetchDepartmentLeaderboard = useCallback(
    () => getLeaderboard(departmentPeriod, 'department'),
    [departmentPeriod] // Re-fetch only when departmentPeriod changes
  );
  const {
    data: departmentData,
    loading: loadingDepartment,
    error: errorDepartment,
  } = useApi(fetchDepartmentLeaderboard);

  // --- Titles ---
  const individualTitle = `${individualPeriod === 'all_time' ? 'All-Time' : individualPeriod.charAt(0).toUpperCase() + individualPeriod.slice(1)} Individual`;
  const departmentTitle = `${departmentPeriod === 'all_time' ? 'All-Time' : departmentPeriod.charAt(0).toUpperCase() + departmentPeriod.slice(1)} Department`;

  return (
    <>
    <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 h-[calc(100vh-15rem)] gap-8 ">
      <div className="flex flex-col bg-slate-50 rounded-4xl p-6 shadow-md overflow-hidden">
        <h2 className="text-xl font-semibold mb-3 text-center text-gray-700">Individual Rankings</h2>
          <PeriodFilters
            selectedPeriod={individualPeriod}
            onPeriodChange={setIndividualPeriod} // Control individual period state
          />
          <div className="flex-grow"> {/* Allow card to fill remaining space */}
            <LeaderboardCard
              title={individualTitle} // Use dynamic title
              data={individualData as LeaderboardData | null}
              type="individual"
              loading={loadingIndividual}
              error={errorIndividual}
            />
          </div>
      </div>
      <div className="flex flex-col bg-slate-50 rounded-4xl p-6 shadow-md overflow-hidden">
        <h2 className="text-xl font-semibold mb-3 text-center text-gray-700">Department Rankings</h2>
          <PeriodFilters
            selectedPeriod={departmentPeriod}
            onPeriodChange={setDepartmentPeriod} // Control department period state
          />
           <div className="flex-grow"> {/* Allow card to fill remaining space */}
            <LeaderboardCard
              title={departmentTitle} // Use dynamic title
              data={departmentData as LeaderboardData | null}
              type="department"
              loading={loadingDepartment}
              error={errorDepartment}
            />
          </div>
      </div>
    </div>
    
    </>
  );
};