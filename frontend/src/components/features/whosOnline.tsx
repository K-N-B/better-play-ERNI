import { useState, useEffect } from 'react';
import { getActivityHub, sendHeartbeat } from '../../api/activityService';
import type { OnlineUser } from '../../types/activity';
import { Users, Wifi } from 'lucide-react'; // Example icons

export const WhosOnline = () => {
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchOnlineUsers = async () => {
             try {
                const response = await getActivityHub();
                if (isMounted) {
                    setOnlineUsers(response.online_users);
                    setLoading(false);
                }
            } catch (error) {
                 if(isMounted) setLoading(false);
                 console.error("Failed to fetch online users:", error);
            }
        };

        const heartbeat = async () => {
            try {
                await sendHeartbeat();
            } catch (error) {
                console.error("Heartbeat failed:", error);
            }
        };

        fetchOnlineUsers(); // Initial fetch
        heartbeat(); // Initial heartbeat
        const fetchIntervalId = setInterval(fetchOnlineUsers, 60000); // Refresh list every 60s
        const heartbeatIntervalId = setInterval(heartbeat, 30000); // Send heartbeat every 30s

        return () => {
            isMounted = false;
            clearInterval(fetchIntervalId);
            clearInterval(heartbeatIntervalId);
        };
    }, []);

    return (
        <div className=" h-full">
            <h3 className="text-xl font-semibold mb-3 flex items-center space-x-2">
                <Users size={22} strokeWidth={2.5}/>
                <span>Who's Online</span>
            </h3>
             {loading ? <div className="text-sm text-gray-500">Loading...</div> : (
                <ul className="space-y-2">
                    {onlineUsers.length > 0 ? onlineUsers.map(user => (
                        <li key={user.id} className="flex items-center space-x-2 text-base text-gray-800">
                           <Wifi size={18} className="text-green-500"/>
                           <span>{user.username}</span>
                        </li>
                    )) : <p className="text-sm text-gray-500">No one else is online right now.</p> }
                </ul>
            )}
        </div>
    );
};