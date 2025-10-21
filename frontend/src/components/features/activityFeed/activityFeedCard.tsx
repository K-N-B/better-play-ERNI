
import { ActivityFeed } from './activityFeed'; // Your existing component
import { ChevronDown, Zap } from 'lucide-react';

export const ActivityFeedCard = () => {
    return (
        <div className="bg-white p-6 rounded-4xl shadow-md border border-gray-100 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold mb-3 flex items-center space-x-2">
                    <Zap size={22} strokeWidth={2.5}/>
                    <div className="text-2xl font-semibold text-gray-800">Activity Feed</div>

                </h3>
                {/* TODO: Implement dropdown functionality later */}
                <button className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">
                    All-time <ChevronDown size={16} className="ml-1" />
                </button>
            </div>
            {/* Embed the existing ActivityFeed component */}
            <div className="flex-grow overflow-y-auto pr-2 -mr-2"> {/* Add padding for scrollbar */}
                 <ActivityFeed />
            </div>
        </div>
    );
};