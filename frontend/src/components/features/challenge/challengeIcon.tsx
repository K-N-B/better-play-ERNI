// src/components/features/challenge/challengeIcon.tsx
import React, { useState, useEffect } from 'react';
import { Swords } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getPendingChallenges } from '../../../api/challengeService';
import clsx from 'clsx';

interface ChallengeIconProps {
    activeClasses?: string;
    hoverClasses?: string;
}

export const ChallengeIcon: React.FC<ChallengeIconProps> = ({
    activeClasses = 'bg-orange-500 text-white shadow-[0_5px_0_0] shadow-orange-900',
    hoverClasses = 'hover:bg-orange-500 hover:text-white'
}) => {
    const [challengeCount, setChallengeCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();

    const isActive = location.pathname === '/challenges';

    useEffect(() => {
        let isMounted = true;

        const fetchPendingCount = async () => {
            try {
                const challenges = await getPendingChallenges();
                if (isMounted) {
                    setChallengeCount(challenges.length);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('[ChallengeIcon] Error fetching pending challenges:', error);
                if (isMounted) {
                    setChallengeCount(0);
                    setIsLoading(false);
                }
            }
        };

        fetchPendingCount();

        // Poll every 60 seconds for updates
        const intervalId = setInterval(fetchPendingCount, 60000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    return (
        <Link
            to="/challenges"
            className={clsx(
                'relative inline-flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-150',
                isActive && `active:translate-y-0.5 active:shadow-[0_3px_0_0] ${activeClasses}`,
                !isActive && `text-primary ${hoverClasses}`
            )}
            aria-label={`View Challenges (${challengeCount} pending)`}
            title={`View Challenges (${challengeCount} pending)`}
        >
            <Swords size={24} strokeWidth={2} />
            
            {/* Badge - show only when not loading and count > 0 */}
            {!isLoading && challengeCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-slate-50 shadow-sm">
                    {challengeCount > 9 ? '9+' : challengeCount}
                </span>
            )}
            
            {/* Loading indicator - pulse dot when loading with 0 count */}
            {isLoading && challengeCount === 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
            )}
        </Link>
    );
};