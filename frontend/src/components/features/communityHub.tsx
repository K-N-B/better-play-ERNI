// A parent component for the homepage that renders the ActivityFeed and WhosOnline components in a layout (e.g., side-by-side).

import React from 'react';
import { ActivityFeed } from './activityFeed';
import { WhosOnline } from './whosOnline';

export const CommunityHub = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <ActivityFeed />
            </div>
            <div>
                <WhosOnline />
            </div>
        </div>
    );
};