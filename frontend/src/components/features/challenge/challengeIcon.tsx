// The Mountain icon in the Navbar. It fetches challengeService.getPendingChallenges() and displays a red dot/count if there are any. Clicking it opens a dropdown linking to the ChallengePage.
import React, { useState, useEffect } from 'react';
import { Mountain } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
// Assuming you have this
import clsx from 'clsx';

interface ChallengeIconProps {
    activeClasses?: string; // e.g., "bg-primary text-white shadow-[...]"
    hoverClasses?: string; // e.g., "hover:bg-primary hover:text-white"
}

export const ChallengeIcon: React.FC<ChallengeIconProps> = ({ // Destructure props
    activeClasses = 'bg-primary text-white shadow-[0_5px_0_0] shadow-primary-900', // Default active style
    hoverClasses = 'hover:bg-primary hover:text-white' // Default hover style
}) => {
    const [challengeCount, setChallengeCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation(); // <-- Get current location'

    // --- Determine if the challenges page is active ---
    const isActive = location.pathname === '/challenges';
    // ---

    useEffect(() => {
        // ... (useEffect for fetching challenge count remains the same) ...
        let isMounted = true;
        const fetchPendingCount = async () => { /* ... */ };
        fetchPendingCount();
        const intervalId = setInterval(fetchPendingCount, 60000);
        return () => { isMounted = false; clearInterval(intervalId); };
    }, []);

    return (
        <Link
            to="/challenges"
            // --- Apply conditional styles based on isActive ---
            className={clsx(
                // Base styles for the icon button
                'relative inline-flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-150 ',
                // Active styles (when on /challenges page)
                isActive && `active:translate-y-[2px] active:shadow-[0_3px_0_0] ${activeClasses}`,
                // Inactive styles
                !isActive && `text-primary ${hoverClasses}`
            )}
            // ---
            aria-label={`View Challenges (${challengeCount} pending)`}
            title={`View Challenges (${challengeCount} pending)`}
        >
            <Mountain size={24} strokeWidth={2} />
            {/* Badge remains the same */}
            {!isLoading && challengeCount > 0 && (
                <span className="absolute -top-1 -right-1 block h-4 w-4 ...">
                    {challengeCount > 9 ? '9+' : challengeCount}
                </span>
            )}
            {isLoading && challengeCount === 0 && (
                <span className="absolute -top-1 -right-1 block h-4 w-4 ... animate-pulse"></span>
            )}
        </Link>
    );
};