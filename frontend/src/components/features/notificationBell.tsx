// The bell icon in the Navbar. It fetches challengeService.getPendingChallenges() and displays a red dot/count if there are any. Clicking it opens a dropdown linking to the ChallengePage.
import React, { useState, useEffect } from 'react';
import { getPendingChallenges } from '../../api/challengeService'; // Ensure correct path
import type { Challenge } from '../../types/challenge';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../ui/loadingSpinner'; // Assuming you have this
import clsx from 'clsx';

interface NotificationsBellProps {
    activeClasses?: string; // e.g., "bg-primary text-white shadow-[...]"
    hoverClasses?: string; // e.g., "hover:bg-primary hover:text-white"
}

export const NotificationsBell: React.FC<NotificationsBellProps> = ({ // Destructure props
    activeClasses = 'bg-primary text-white shadow-[0_5px_0_0] shadow-primary-900', // Default active style
    hoverClasses = 'hover:bg-primary hover:text-white' // Default hover style
}) => {
    const [pendingChallenges, setPendingChallenges] = useState<Challenge[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const isActive = isDropdownOpen; // Bell is "active" when dropdown is open

    useEffect(() => {
        let isMounted = true;
        let intervalId: ReturnType<typeof setInterval> | null = null;

        const fetchPending = async () => {
             // Only set loading true initially or when opening dropdown
             if (isMounted && !pendingChallenges.length) setIsLoading(true);
             try {
                const data = await getPendingChallenges();
                if (isMounted) {
                    setPendingChallenges(data);
                }
            } catch (error) {
                 console.error("Failed to fetch pending challenges:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchPending(); // Initial fetch
        intervalId = setInterval(fetchPending, 60000); // Poll every 60 seconds

        return () => {
            isMounted = false;
            if (intervalId) clearInterval(intervalId);
        };
        // Intentionally not re-running on isDropdownOpen to rely on polling
    }, []);

    const challengeCount = pendingChallenges.length;

    // Close dropdown if clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Basic check, might need refinement based on exact DOM structure
             if (isDropdownOpen && !(event.target as Element).closest('.relative')) {
                setIsDropdownOpen(false);
             }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen]);


    return (
        <div className="relative items-center"> {/* Added class for positioning context */}
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                // --- Apply conditional styles ---
                className={clsx(
                    // Base styles
                    'relative inline-flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-150',
                    // Active styles (when dropdown is open)
                    isActive && `active:translate-y-[2px] active:shadow-[0_3px_0_0] ${activeClasses}`,
                    // Inactive styles
                    !isActive && `text-primary ${hoverClasses}`
                )}
                // ---
                aria-label="Notifications"
                aria-haspopup="true"
                aria-expanded={isDropdownOpen}
            >
                <Bell size={20} />
                {challengeCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full ring-2 ring-white bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {challengeCount > 9 ? '9+' : challengeCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
                <div
                 className="origin-top-right absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
                 role="menu" aria-orientation="vertical" aria-labelledby="menu-button" tabIndex={-1}
                 >
                    <div className="py-1" role="none">
                        <div className="px-4 py-2 text-sm font-semibold text-gray-800 border-b">
                            Pending Challenges ({challengeCount})
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                            {isLoading ? (
                                <div className="p-4 text-center"><LoadingSpinner /></div>
                            ) : challengeCount > 0 ? (
                                pendingChallenges.map(challenge => (
                                    <Link
                                        key={challenge.id}
                                        to={`/game/${challenge.puzzle_type}?challenge_id=${challenge.id}`}
                                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                                        role="menuitem" tabIndex={-1}
                                        onClick={() => setIsDropdownOpen(false)} // Close dropdown on click
                                    >
                                        <p>
                                            <strong className="font-medium">{challenge.challenger.username}</strong> challenged you to{' '}
                                            <strong className="font-medium">{challenge.puzzle_type}</strong>!
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Their score: {challenge.challenger_submission.points_awarded} pts {/* Use points_awarded */}
                                        </p>
                                    </Link>
                                ))
                            ) : (
                                <p className="px-4 py-3 text-sm text-gray-500">No pending challenges.</p>
                            )}
                        </div>
                         {/* Optional Link to view all challenges */}
                        <Link
                            to="/challenges" // Your challenge history page
                            className="block px-4 py-2 text-sm text-center text-primary hover:bg-gray-50 border-t"
                            role="menuitem" tabIndex={-1}
                            onClick={() => setIsDropdownOpen(false)}
                            >
                            View All Challenges
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};