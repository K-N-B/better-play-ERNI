import React from 'react';
import { useApi } from '../../../hooks/useApi';
import { getLeaderboard } from '../../../api/leaderboardService';
import { LoadingSpinner } from '../../ui/loadingSpinner';
import { LeaderboardList } from './leaderboardList'; // <-- 1. Import LeaderboardList
import type { IndividualScoreEntry, LeaderboardPeriod, LeaderboardType } from '../../../types/leaderboard';
import { ChevronDown, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

const PREVIEW_LIMIT = 10; // How many entries to show

export const LeaderboardPreviewCard = () => {
    // Fetch e.g., daily individual for preview
    const fetchPreviewData = React.useCallback(() => getLeaderboard('daily', 'individual'), []);
    const { data, loading, error } = useApi(fetchPreviewData);

    // Ensure data is typed correctly and limited
    const previewData = (data as IndividualScoreEntry[] | null)?.slice(0, PREVIEW_LIMIT) ?? [];

    return (
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col h-full"> {/* Added flex flex-col h-full */}
             <div className="flex justify-between items-center flex-shrink-0"> {/* Prevent header shrinking */}
                <h3 className="text-xl font-semibold mb-3 flex items-center space-x-3">
                    <Trophy size={22} strokeWidth={2.5}/>
                    <div className="text-2xl font-semibold text-gray-800">Leaderboards</div>
                </h3>
                {/* TODO: Implement dropdown functionality later */}
                <button className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">
                    Daily {/* Changed default view? */} <ChevronDown size={16} className="ml-1" />
                </button>
            </div>

            {/* --- Use LeaderboardList Component --- */}
            <div className="flex-grow overflow-y-auto "> {/* Allow list to scroll */}
                {loading && <div className="text-center py-4"><LoadingSpinner /></div>}
                {error && <p className="text-center py-4 text-red-600">Could not load leaderboard.</p>}
                {!loading && !error && (
                    <LeaderboardList
                        data={previewData}
                        type="individual" // Type is always individual for this preview
                        offsetRank={1} // Start ranking from 1 for the preview
                    />
                )}
            </div>
             {/* --- End Use LeaderboardList --- */}


             {/* Link to full leaderboard page */}
             <Link to="/leaderboards" className="block text-center text-sm text-primary mt-4 hover:underline flex-shrink-0"> {/* Prevent link shrinking */}
                View All Rankings
             </Link>
        </div>
    );
};