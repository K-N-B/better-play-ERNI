import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { getActivityFeed, type ActivityFeedEntry } from '../../../api/userService';

export const ActivityFeedCard = () => {
    const [activities, setActivities] = useState<ActivityFeedEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadActivities();
        
        // Refresh every 30 seconds
        const interval = setInterval(loadActivities, 30000);
        
        return () => clearInterval(interval);
    }, []);

    const loadActivities = async () => {
        try {
            const data = await getActivityFeed(20);
            setActivities(data);
            setError(null);
        } catch (err: any) {
            console.error('Failed to load activity feed:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatActivityMessage = (activity: ActivityFeedEntry): string => {
        switch (activity.event_type) {
            case 'puzzle_completed':
                return `${activity.user.username} completed ${activity.puzzle_type?.toUpperCase()} in ${activity.tries} tries - ${activity.points} pts`;
            case 'streak_milestone':
                return `${activity.user.username} reached a ${activity.metadata.streak_count}-day streak! 🔥`;
            case 'leaderboard_top':
                return `${activity.user.username} reached #${activity.metadata.position} on the leaderboard! 🏆`;
            case 'achievement_unlocked':
                return `${activity.user.username} unlocked '${activity.metadata.achievement_name}' achievement! 🎉`;
            default:
                return `${activity.user.username} - ${activity.event_type}`;
        }
    };

    return (
        <div className="bg-white p-6 rounded-4xl shadow-md border border-gray-100 flex flex-col h-full">
            <div className="flex items-center space-x-3 mb-4 flex-shrink-0">
                <Activity size={22} strokeWidth={2.5} />
                <h3 className="text-2xl font-semibold text-gray-800">Activity Feed</h3>
            </div>

            <div className="flex-grow overflow-y-auto">
                {loading && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-gray-500">Loading activities...</p>
                    </div>
                )}

                {error && (
                    <div className="text-center py-8 text-red-600">
                        <p>Failed to load activity feed</p>
                        <button 
                            onClick={loadActivities}
                            className="mt-2 text-sm text-primary hover:underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!loading && !error && activities.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p>No recent activity</p>
                        <p className="text-sm mt-1">Be the first to complete a puzzle!</p>
                    </div>
                )}

                {!loading && !error && activities.length > 0 && (
                    <ul className="space-y-3">
                        {activities.map((activity) => (
                            <li 
                                key={activity.id}
                                className="border-l-4 border-primary pl-4 py-2 hover:bg-gray-50 transition-colors rounded-r"
                            >
                                <p className="text-sm text-gray-800">
                                    {formatActivityMessage(activity)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {activity.time_ago}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};