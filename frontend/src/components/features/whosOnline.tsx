// frontend/src/components/features/activity/whosOnline.tsx
import { useState, useEffect } from 'react';
import { getActivityHub, sendHeartbeat } from '../../api/activityService';
import type { OnlineUser } from '../../types/activity';
import { Users, Wifi } from 'lucide-react';

export const WhosOnline = () => {
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('🎯 [WhosOnline] Component mounted');
        let isMounted = true;
        
        const fetchOnlineUsers = async () => {
            try {
                console.log('🔄 [WhosOnline] Fetching online users...');
                const response = await getActivityHub();
                console.log('✅ [WhosOnline] Response:', response);
                console.log('👥 [WhosOnline] Online users:', response.online_users);
                
                if (isMounted) {
                    setOnlineUsers(response.online_users);
                    setLoading(false);
                }
            } catch (error) {
                console.error('❌ [WhosOnline] Failed to fetch:', error);
                if (isMounted) setLoading(false);
            }
        };

        const heartbeat = async () => {
            try {
                console.log('💓 [WhosOnline] Sending heartbeat...');
                await sendHeartbeat();
                console.log('✅ [WhosOnline] Heartbeat sent');
            } catch (error) {
                console.error('❌ [WhosOnline] Heartbeat failed:', error);
            }
        };

        // Initial calls
        heartbeat();
        fetchOnlineUsers();
        
        // Set up intervals
        const heartbeatInterval = setInterval(heartbeat, 30000); // 30s
        const fetchInterval = setInterval(fetchOnlineUsers, 60000); // 60s

        return () => {
            console.log('🔚 [WhosOnline] Component unmounting');
            isMounted = false;
            clearInterval(heartbeatInterval);
            clearInterval(fetchInterval);
        };
    }, []);

    return (
        <div className="h-full">
            <h3 className="text-2xl font-semibold mb-3 flex items-center space-x-2">
                <Users size={22} strokeWidth={2.5}/>
                <span>Who's Online ({onlineUsers.length})</span>
            </h3>
            {loading ? (
                <div className="text-sm text-gray-500">Loading...</div>
            ) : (
                <ul className="space-y-2">
                    {onlineUsers.length > 0 ? (
                        onlineUsers.map(user => (
                            <li key={user.id} className="flex items-center space-x-2 text-base text-gray-800">
                                <Wifi size={18} className="text-green-500"/>
                                <span>{user.username}</span>
                            </li>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500">No one else is online right now.</p>
                    )}
                </ul>
            )}
        </div>
    );
};
