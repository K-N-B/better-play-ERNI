import { Clock, Trophy } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
    activeTab: 'pending' | 'history' | 'stats';
    setActiveTab: (t: 'pending' | 'history' | 'stats') => void;
    activePendingCount: number;
    totalCompleted: number;
}

export const ChallengeTabs = ({
    activeTab,
    setActiveTab,
    activePendingCount,
    totalCompleted
}: Props) => (
    <div className="flex border-b border-gray-200 px-6 mt-4">
        {/* Pending */}
        <button
            onClick={() => setActiveTab('pending')}
            className={clsx(
                'px-6 py-3 font-medium text-sm transition-colors relative',
                activeTab === 'pending'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
            )}
        >
            <div className="flex items-center gap-2">
                <Clock size={18} />
                <span>Pending</span>
                {activePendingCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                        {activePendingCount}
                    </span>
                )}
            </div>
        </button>

        {/* History */}
        <button
            onClick={() => setActiveTab('history')}
            className={clsx(
                'px-6 py-3 font-medium text-sm transition-colors relative',
                activeTab === 'history'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
            )}
        >
            <div className="flex items-center gap-2">
                <Trophy size={18} />
                <span>History</span>
                {totalCompleted > 0 && (
                    <span className="bg-gray-400 text-white text-xs rounded-full px-2 py-0.5">
                        {totalCompleted}
                    </span>
                )}
            </div>
        </button>

        {/* Stats */}
        <button
            onClick={() => setActiveTab('stats')}
            className={clsx(
                'px-6 py-3 font-medium text-sm transition-colors relative',
                activeTab === 'stats'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
            )}
        >
        </button>
    </div>
);
