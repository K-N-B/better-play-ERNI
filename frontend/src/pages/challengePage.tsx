import React, { useState, useEffect } from 'react';
import { getPendingChallenges, getCompletedChallenges } from '../api/challengeService';
import { useChallenges } from '../context/ChallengeContext';
import { useAuth } from '../hooks/authContext';
import type { Challenge } from '../types/challenge';
import { isChallengeExpired } from '../types/challenge';
import { LoadingSpinner } from '../components/ui/loadingSpinner';

import { ChallengeHeader } from '../components/features/challenge/challengeHeader';
import { ChallengeTabs } from '../components/features/challenge/challengeTabs';
import { PendingChallenges } from '../components/features/challenge/challengePending';
import { HistoryChallenges } from '../components/features/challenge/challengeHistory';
import { ChallengeStats } from '../components/features/challenge/challengeStats';

export const ChallengePage = () => {
    const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'stats'>('pending');
    const [pending, setPending] = useState<Challenge[]>([]);
    const [completed, setCompleted] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { refreshChallenges } = useChallenges();
    const { user } = useAuth();

    useEffect(() => {
        const fetchChallenges = async () => {
            setLoading(true);
            setError(null);
            try {
                const [pendingData, completedData] = await Promise.all([
                    getPendingChallenges(),
                    getCompletedChallenges(),
                ]);
                setPending(pendingData);
                setCompleted(completedData);
                await refreshChallenges();
            } catch (err) {
                setError('Failed to load challenges.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchChallenges();
    }, [refreshChallenges]);

    if (!user) return <div className="text-center py-16"><LoadingSpinner /></div>;

    const activePending = pending.filter(c => !isChallengeExpired(c));
    const expiredPending = pending.filter(c => isChallengeExpired(c));
    const wonChallenges = completed.filter(c => c.winner?.id === c.recipient?.id);

    return (
        <div className="container mx-auto h-full w-full shadow-md">
            <div className="bg-white rounded-4xl shadow-lg p-4 sm:p-8 md:p-10 overflow-hidden">

                <ChallengeHeader />

                <ChallengeTabs 
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    activePendingCount={activePending.length}
                    totalCompleted={completed.length}
                />

                <div className="p-6">
                    {loading && (
                        <div className="text-center py-16"><LoadingSpinner /></div>
                    )}

                    {!loading && !error && activeTab === 'pending' && (
                        <PendingChallenges
                            user={user}
                            activePending={activePending}
                            expiredPending={expiredPending}
                            refreshChallenges={refreshChallenges}
                        />
                    )}

                    {!loading && !error && activeTab === 'history' && (
                        <HistoryChallenges completed={completed} />
                    )}
                </div>

                {!loading && !error && (
                    <ChallengeStats
                        active={activePending.length}
                        expired={expiredPending.length}
                        won={wonChallenges.length}
                        total={completed.length}
                    />
                )}
            </div>
        </div>
    );
};
