import { useState, useEffect } from 'react'; // Import useState, useEffect
import { useAuth } from '../../hooks/authContext';
import { getTodaySubmissions } from '../../api/gameService'; // Import the new function
import type { Submission } from '../../types/game'; // Import Submission type

const TOTAL_DAILY_PUZZLES = 3;

export const WelcomeMessage = () => {
    const { user } = useAuth();
    const [submissionsToday, setSubmissionsToday] = useState<Submission[]>([]);
    const [loadingStats, setLoadingStats] = useState(false);

    // Fetch today's submissions when the component mounts or user changes
    useEffect(() => {
        if (user) {
            setLoadingStats(true);
            getTodaySubmissions()
                .then(data => {
                    setSubmissionsToday(data);
                })
                .catch(err => {
                    console.error("Failed to fetch today's submissions:", err);
                    setSubmissionsToday([]); // Set empty on error
                })
                .finally(() => {
                    setLoadingStats(false);
                });
        } else {
            setSubmissionsToday([]); // Clear if user logs out
            setLoadingStats(false);
        }
    }, [user]); // Re-run if the user changes

    if (!user) return null;

    // --- Calculate stats based on fetched submissions ---
    const puzzlesCompletedToday = submissionsToday.length;
    const puzzlesLeftToday = Math.max(0, TOTAL_DAILY_PUZZLES - puzzlesCompletedToday);
    const dailyScore = submissionsToday.reduce((sum, sub) => sum + sub.points_awarded, 0);
    // ---

    return (
        <div className="p-6 bg-white rounded-4xl text-base shadow border border-gray-200">
            <h1 className="text-lg font-semibold text-primary mb-2">
                Welcome back, {user.username}! 👋
            </h1>

            {loadingStats ? (
                <p className="text-black animate-pulse">Loading today's stats...</p>
            ) : (
                <>
                    {puzzlesLeftToday > 0 ? (
                        <p className="text-black leading-5">
                            You still have <strong className="text-primary">{puzzlesLeftToday}</strong> puzzle
                            {puzzlesLeftToday !== 1 ? 's' : ''} left to play today. Maybe you're up for a challenge?
                        </p>
                    ) : (
                        <p className="text-black">
                            You've completed all puzzles for today! Great job! 🎉
                        </p>
                    )}

                    <p className="text-black mt-1">
                        You've earned <strong className="text-primary">{dailyScore}pts  </strong> for today!
                    </p>
                </>
            )}
        </div>
    );
};