import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { getWhosOnline, type OnlineUser } from '../../api/userService';

export const WhosOnlineCard = () => {
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadOnlineUsers();
        
        // Refresh every 30 seconds
        const interval = setInterval(loadOnlineUsers, 30000);
        
        return () => clearInterval(interval);
    }, []);

    const loadOnlineUsers = async () => {
        try {
            const data = await getWhosOnline();
            setOnlineUsers(data);
            setError(null);
        } catch (err: any) {
            console.error('Failed to load online users:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getUserInitial = (username: string): string => {
        return username.charAt(0).toUpperCase();
    };

    return (
        <div className="bg-white p-6 rounded-4xl shadow-md border border-gray-100 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center space-x-3">
                    <Users size={22} strokeWidth={2.5} />
                    <h3 className="text-2xl font-semibold text-gray-800">Who's Online</h3>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">{onlineUsers.length}</span>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto">
                {loading && (
                    <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    </div>
                )}

                {error && (
                    <div className="text-center py-4 text-red-600 text-sm">
                        <p>Failed to load</p>
                    </div>
                )}

                {!loading && !error && onlineUsers.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                        <p>No one else online</p>
                    </div>
                )}

                {!loading && !error && onlineUsers.length > 0 && (
                    <ul className="space-y-2">
                        {onlineUsers.map((user) => (
                            <li 
                                key={user.id}
                                className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 bg-sky-400 rounded-full flex items-center justify-center text-white font-bold">
                                        {getUserInitial(user.username)}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                </div>
                                <span className="text-sm font-medium text-gray-800">
                                    {user.username}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};