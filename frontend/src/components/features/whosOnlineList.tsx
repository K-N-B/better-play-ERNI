// frontend/src/components/features/activity/whosOnlineList.tsx
import { useState, useEffect } from 'react';
import { getActivityHub, sendHeartbeat } from '../../api/activityService';
import type { OnlineUser } from '../../types/activity';
import { Wifi } from 'lucide-react';

export const WhosOnlineList = () => {
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchOnlineUsers = async () => {
            try {
                const response = await getActivityHub();
                if (isMounted) setOnlineUsers(response.online_users || []);
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch online users', error);
                if (isMounted) setLoading(false);
            }
        };

        const heartbeat = async () => {
            try {
                await sendHeartbeat();
            } catch (error) {
                console.error('Heartbeat failed', error);
            }
        };

        heartbeat();
        fetchOnlineUsers();

        const heartbeatInterval = setInterval(heartbeat, 30000);
        const fetchInterval = setInterval(fetchOnlineUsers, 60000);

        return () => {
            isMounted = false;
            clearInterval(heartbeatInterval);
            clearInterval(fetchInterval);
        };
    }, []);

    if (loading) return <div className="text-sm text-gray-500">Loading...</div>;

    return (
        <div className="h-full">
            {onlineUsers.length ? (
                <ul className="space-y-2">
                    {onlineUsers.map(user => (
                        <li key={user.id} className="flex items-center space-x-2 text-base text-gray-800">
                            <Wifi size={18} className="text-green-500" />
                            <span>{user.username}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-sm text-gray-500">No one else is online right now.</div>
            )}
        </div>
    );
};
