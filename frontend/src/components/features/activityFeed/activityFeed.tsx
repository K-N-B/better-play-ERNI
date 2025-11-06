import { useState, useEffect } from 'react';
import { getActivityHub } from '../../../api/activityService.ts';
import type { ActivityEvent } from '../../../types/activity.ts';
import { LoadingSpinner } from '../../ui/loadingSpinner.tsx';
import { ActivityFeedItem } from './activityFeedItem'; // <-- Import the new component
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
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAndSetActivities(); // Initial fetch
    const intervalId = setInterval(fetchAndSetActivities, 30000); // Refresh every 30s

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // We no longer render the list directly here
  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((event) => (
              <ActivityFeedItem key={event.id} event={event} />
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-10">
              No recent activity. Be the first to play!
            </p>
          )}
        </div>
      )}
    </>
  );
};
