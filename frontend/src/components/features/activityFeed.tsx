// Fetches from api/activity-hub/ on a timer (e.g., setInterval every 30s) and renders the list of ActivityEvent messages.

import { useState, useEffect } from 'react';
import { getActivityHub } from '../../api/activityService';
import type { ActivityEvent } from '../../types';
import { LoadingSpinner } from '../ui/loadingSpinner';
import { MessageSquareText } from 'lucide-react'; // Example icon

// Helper to format time difference
const timeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
};


export const ActivityFeed = () => {
    const [activities, setActivities] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchAndSetActivities = async () => {
             try {
                const response = await getActivityHub();
                if (isMounted) {
                    setActivities(response.recent_activity);
                    setLoading(false);
                }
            } catch (error) {
                 if(isMounted) setLoading(false);
                 console.error("Failed to fetch activities:", error);
            }
        };

        fetchAndSetActivities(); // Initial fetch
        const intervalId = setInterval(fetchAndSetActivities, 30000); // Refresh every 30s

        return () => {
            isMounted = false; // Prevent state updates after unmount
            clearInterval(intervalId); // Cleanup interval
        };
    }, []);

    return (
        <div className="bg-white p-4 rounded-lg shadow h-full">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Recent Activity</h3>
            {loading ? <LoadingSpinner /> : (
                <ul className="space-y-3">
                    {activities.length > 0 ? activities.map(event => (
                        <li key={event.id} className="flex items-start space-x-3 text-sm">
                           <MessageSquareText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <span className="font-medium text-gray-800">{event.user.username}</span>
                                <span className="text-gray-600"> {event.message}</span>
                                <span className="text-xs text-gray-400 ml-2">{timeAgo(event.created_at)}</span>
                            </div>
                        </li>
                    )) : <p className="text-sm text-gray-500">No recent activity.</p> }
                </ul>
            )}
        </div>
    );
};