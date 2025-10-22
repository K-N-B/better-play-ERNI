import type { LeaderboardData, LeaderboardType } from '../../../types/leaderboard';
import { LeaderboardPodium } from './leaderboardPodium';
import { LeaderboardList } from './leaderboardList';
import { LoadingSpinner } from '../../ui/loadingSpinner';

interface LeaderboardCardProps {
    title: string; // e.g., "Weekly Individual", "All-Time Department"
    data: LeaderboardData | null;
    type: LeaderboardType;
    loading: boolean;
    error: Error | null;
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ title, data, type, loading, error }) => {
    console.log(`[LeaderboardCard] Received props for "${title}". Type: ${type}, Data:`, data);
    const topThree = data ? data.slice(0, 3) : [];
    const restOfList = data ? data.slice(3) : [];

    return (
        <div className="flex flex-col bg-slate-50 rounded-3xl p-6 shadow-md overflow-hidden h-[calc(100vh-12rem)]"> {/* Adjust height as needed */}
        {/* Header */}
        <div className="flex justify-start items-center mb-4">
            <div className="text-xl font-bold text-primary py-1">{title}</div>
        </div>

        {/* Content */}
        {loading && <div className="flex-grow flex items-center justify-center"><LoadingSpinner /></div>}
        {error && <p className="flex-grow flex items-center justify-center text-red-600">Failed to load data.</p>}
        {!loading && !error && data && data.length > 0 && (
            <>
            {/* Podium for Top 3 */}
            <LeaderboardPodium topThree={topThree} type={type} />

            {/* Divider */}
            <hr className="my-4 border-gray-300"/>

            {/* List/Table for Ranks 4+ */}
            <LeaderboardList data={restOfList} type={type} offsetRank={4} />
            </>
        )}
        {!loading && !error && (!data || data.length === 0) && (
            <p className="flex-grow flex items-center justify-center text-gray-500">No data available.</p>
        )}
        </div>
    );
};
