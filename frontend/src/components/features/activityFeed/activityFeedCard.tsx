/* eslint-disable prettier/prettier */
import { ActivityFeed } from './activityFeed'; // Your existing component
import { Zap } from 'lucide-react';

export const ActivityFeedCard = () => {
  return (
    <div className="bg-white p-6 rounded-4xl shadow-md border border-gray-100 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold mb-3 flex items-center space-x-2">
          <Zap size={22} strokeWidth={2.5} />
          <div className="text-xl font-semibold text-black">Activity Feed</div>
        </h3>
      </div>
      {/* Embed the existing ActivityFeed component */}
      <div className="flex-grow overflow-y-auto pr-2 -mr-2">
        {' '}
        {/* Add padding for scrollbar */}
        <ActivityFeed />
      </div>
    </div>
  );
};
