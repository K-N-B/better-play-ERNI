// Fetches and displays lists of pending, sent, and completed challenges.

import React, { useState, useEffect } from 'react';
import { getPendingChallenges, getCompletedChallenges } from '../api/challengeService';
import type { Challenge } from '../types/challenge';
import { LoadingSpinner } from '../components/ui/loadingSpinner';
import { Link } from 'react-router-dom';
import { Swords, CheckCircle, Hourglass, User, X } from 'lucide-react'; // Ensure X is imported
// import { useAuth } from '../context/AuthContext'; // If needed for current user ID

// Simple component to display a single challenge item
const ChallengeItem: React.FC<{ challenge: Challenge }> = ({ challenge }) => {
    const isPending = challenge.status === 'PENDING';
    // const { user: currentUser } = useAuth(); // Example: Get current user
    // const isLoggedInUserRecipient = currentUser?.id === challenge.recipient.id;
    // const won = challenge.winner?.id === currentUser?.id;
    // const lost = challenge.winner && challenge.winner.id !== currentUser?.id;

    // Simplified win/loss logic assuming the logged-in user is always the recipient in this view
    const won = challenge.winner?.id === challenge.recipient?.id;
    const lost = challenge.winner?.id === challenge.challenger?.id;

    return (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-start space-x-4">
             <div className="flex-shrink-0 pt-1">
                 {isPending ? <Hourglass className="text-yellow-500" /> : won ? <CheckCircle className="text-green-500" /> : lost ? <X className="text-red-500" /> : <Swords className="text-gray-500"/>}
             </div>
             <div>
                <p className="text-sm">
                    {/* Adjust message based on perspective if needed */}
                     Challenge {isPending ? 'from' : 'vs'} <strong className="font-medium">{challenge.challenger.username}</strong> on{' '}
                     <strong className="font-medium">{challenge.puzzle_type}</strong>
                </p>
                 <p className="text-xs text-gray-500 mt-1">
                     Challenger Score: {challenge.challenger_submission.points_awarded} pts {/* Use points_awarded */}
                 </p>
                 {challenge.recipient_submission && (
                     <p className="text-xs text-gray-500">
                         Your Score: {challenge.recipient_submission.points_awarded} pts {/* Use points_awarded */}
                         {won && <span className="ml-2 font-semibold text-green-600">(You Won!)</span>}
                         {lost && <span className="ml-2 font-semibold text-red-600">(You Lost)</span>}
                     </p>
                 )}
                 {isPending && (
                     <Link
                         to={`/game/${challenge.puzzle_type}?challenge_id=${challenge.id}`}
                         className="mt-2 inline-block px-3 py-1 bg-primary text-white text-xs font-medium rounded hover:bg-primary-dark"
                     >
                         Play Now
                     </Link>
                 )}
             </div>
        </div>
    );
};


export const ChallengePage = () =>  {
    const [pending, setPending] = useState<Challenge[]>([]);
    const [completed, setCompleted] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchChallenges = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch both lists in parallel
                const [pendingData, completedData] = await Promise.all([
                    getPendingChallenges(),
                    getCompletedChallenges(),
                ]);
                setPending(pendingData);
                setCompleted(completedData);
            } catch (err) {
                setError('Failed to load challenges.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchChallenges();
    }, []); // Fetch only on mount


    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Your Challenges</h1>

            {loading && <div className="text-center py-10"><LoadingSpinner /></div>}
            {error && <p className="text-center py-10 text-red-600">{error}</p>}

            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Pending Challenges */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Pending Challenges</h2>
                        {pending.length > 0 ? (
                            <div className="space-y-4">
                                {pending.map(c => <ChallengeItem key={`pending-${c.id}`} challenge={c} />)}
                            </div>
                        ) : (
                            <p className="text-gray-500 bg-white p-4 rounded-lg shadow border border-gray-100">No challenges waiting for you.</p>
                        )}
                    </div>

                    {/* Completed Challenges */}
                     <div>
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Challenge History</h2>
                         {completed.length > 0 ? (
                            <div className="space-y-4">
                                {completed.map(c => <ChallengeItem key={`completed-${c.id}`} challenge={c} />)}
                            </div>
                        ) : (
                            <p className="text-gray-500 bg-white p-4 rounded-lg shadow border border-gray-100">No completed challenges yet.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}