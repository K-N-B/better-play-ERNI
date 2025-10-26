// Fetches and displays lists of pending, sent, and completed challenges.

import React, { useState, useEffect } from 'react';
import { getPendingChallenges, getCompletedChallenges } from '../api/challengeService';
import type { Challenge } from '../types/challenge';
import { LoadingSpinner } from '../components/ui/loadingSpinner';
import { ChallengeItem } from '../components/features/challengeItem';



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
        
        <div className="container mx-auto p-4 rounded-4xl bg-white">
            
            <h1 className="text-3xl text-center font-bold pt-2">Your Challenges</h1>

            {loading && <div className="text-center py-10"><LoadingSpinner /></div>}
            {error && <p className="text-center py-10 text-red-600">{error}</p>}

           
                {!loading && !error && (
                    
                    <div className="mx-auto grid grid-cols-2 h-full gap-8 ">
                        {/* Pending Challenges */}
                        <div className="flex flex-col p-6 ">
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
                        <div className="flex flex-col p-6">
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