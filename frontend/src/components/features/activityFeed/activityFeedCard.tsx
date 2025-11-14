
import { ActivityFeed } from './activityFeed'; // Your existing component
import { ChevronDown, Zap } from 'lucide-react';

export const ActivityFeedCard = () => {
    return (
        <div className="bg-white p-6 rounded-4xl shadow-md border border-gray-100 h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold mb-3 flex items-center space-x-2">
            <Zap size={22} strokeWidth={2.5} />
            <div className="text-xl font-semibold text-black">Activity Feed</div>
            </h3>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            <ActivityFeed />
        </div>
        </div>
    );
};