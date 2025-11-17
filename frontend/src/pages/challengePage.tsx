// src/pages/ChallengePage.tsx - UPDATED WITH TABS AND STATS
import React, { useState, useEffect } from 'react';
import { getPendingChallenges, getCompletedChallenges } from '../api/challengeService';
import { useChallenges } from '../context/ChallengeContext';
import { useAuth } from '../hooks/authContext';
import type { Challenge } from '../types/challenge';
import { isChallengeExpired, getChallengeExpiryStatus } from '../types/challenge';
import { LoadingSpinner } from '../components/ui/loadingSpinner';
import { ChallengeItem } from '../components/features/challenge/challengeItem';
import { AlertCircle, Clock, CheckCircle2, Trophy } from 'lucide-react';
import { clsx } from 'clsx';

type TabType = 'pending' | 'history';

export const ChallengePage = () => {
    const [activeTab, setActiveTab] = useState<TabType>('pending');
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

    // Calculate stats
    const activePending = pending.filter(c => !isChallengeExpired(c));
    const expiredPending = pending.filter(c => isChallengeExpired(c));
    const wonChallenges = completed.filter(c => c.winner?.id === c.recipient?.id);
    const totalCompleted = completed.length;

    // If user is not loaded yet, show loading
    if (!user) {
        return <div className="text-center py-16"><LoadingSpinner /></div>;
    }

    return (
        <div className="container mx-auto p-4 max-w-5xl">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="p-6 pb-0">
                    <div className="flex items-center gap-3 mb-2">
                        <svg 
                            className="text-blue-600" 
                            width="32" 
                            height="32" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                        >
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <path d="M16 10a4 4 0 0 1-8 0"/>
                        </svg>
                        <h1 className="text-3xl font-bold text-gray-900">Challenges</h1>
                    </div>
                    <p className="text-gray-600 ml-11">
                        Challenge your colleagues and compete on daily puzzles!
                    </p>
                </div>

                {/* Tip Banner */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mx-6 mt-4 rounded">
                    <div className="flex items-start">
                        <AlertCircle className="text-blue-600 mt-0.5 mr-3 flex-shrink-0" size={20} />
                        <div className="text-sm text-blue-800">
                            <span className="font-semibold">Pro tip:</span> Challenges expire after 24 hours. 
                            Complete them quickly to keep your streak going!
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 px-6 mt-4">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={clsx(
                            'px-6 py-3 font-medium text-sm transition-colors relative',
                            activeTab === 'pending'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Clock size={18} />
                            <span>Pending</span>
                            {activePending.length > 0 && (
                                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 ml-1">
                                    {activePending.length}
                                </span>
                            )}
                        </div>
                    </button>
                    
                    <button
                        onClick={() => setActiveTab('history')}
                        className={clsx(
                            'px-6 py-3 font-medium text-sm transition-colors relative',
                            activeTab === 'history'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Trophy size={18} />
                            <span>History</span>
                            {totalCompleted > 0 && (
                                <span className="bg-gray-400 text-white text-xs rounded-full px-2 py-0.5 ml-1">
                                    {totalCompleted}
                                </span>
                            )}
                        </div>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading && (
                        <div className="text-center py-16">
                            <LoadingSpinner />
                        </div>
                    )}
                    
                    {error && (
                        <div className="text-center py-16">
                            <AlertCircle className="mx-auto text-red-500 mb-3" size={48} />
                            <p className="text-red-600 font-medium">{error}</p>
                        </div>
                    )}

                    {!loading && !error && activeTab === 'pending' && (
                        <div className="space-y-3">
                            {/* Active Pending Challenges - Separate by role */}
                            {activePending.length > 0 && (
                                <>
                                    {/* Challenges TO YOU (need to complete) */}
                                    {activePending.filter(c => c.recipient.id === user.id).length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                                                Challenges for You
                                            </h3>
                                            <div className="space-y-3">
                                                {activePending
                                                    .filter(c => c.recipient.id === user.id)
                                                    .map(c => (
                                                        <ChallengeItem 
                                                            key={`pending-${c.id}`} 
                                                            challenge={c}
                                                            onPlayClick={refreshChallenges}
                                                        />
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    )}

                                    {/* Challenges FROM YOU (waiting for response) */}
                                    {activePending.filter(c => c.challenger.id === user.id).length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                                                Challenges You Sent
                                            </h3>
                                            <div className="space-y-3">
                                                {activePending
                                                    .filter(c => c.challenger.id === user.id)
                                                    .map(c => (
                                                        <ChallengeItem 
                                                            key={`sent-${c.id}`} 
                                                            challenge={c}
                                                        />
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Expired Challenges Section */}
                            {expiredPending.length > 0 && (
                                <div className="mt-6">
                                    <div className="flex items-center gap-2 mb-3 text-orange-600">
                                        <AlertCircle size={18} />
                                        <h3 className="font-semibold">Expired Challenges</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {expiredPending.map(c => (
                                            <ChallengeItem 
                                                key={`expired-${c.id}`} 
                                                challenge={c}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {activePending.length === 0 && expiredPending.length === 0 && (
                                <div className="text-center py-16">
                                    <Clock className="mx-auto text-gray-300 mb-4" size={64} />
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                        No Pending Challenges
                                    </h3>
                                    <p className="text-gray-500">
                                        You're all caught up! Check back later for new challenges.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {!loading && !error && activeTab === 'history' && (
                        <div className="space-y-3">
                            {completed.length > 0 ? (
                                completed.map(c => (
                                    <ChallengeItem 
                                        key={`completed-${c.id}`} 
                                        challenge={c}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-16">
                                    <Trophy className="mx-auto text-gray-300 mb-4" size={64} />
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                        No Completed Challenges
                                    </h3>
                                    <p className="text-gray-500">
                                        Complete your first challenge to see it here!
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Stats Footer */}
                {!loading && !error && (
                    <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="text-2xl font-bold text-blue-600">
                                    {activePending.length}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">Active</div>
                            </div>
                            
                            <div className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="text-2xl font-bold text-orange-600">
                                    {expiredPending.length}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">Expired</div>
                            </div>
                            
                            <div className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="text-2xl font-bold text-green-600">
                                    {wonChallenges.length}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">Won</div>
                            </div>
                            
                            <div className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="text-2xl font-bold text-purple-600">
                                    {totalCompleted}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">Total</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};