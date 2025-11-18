// src/context/ChallengeContext.tsx - UPDATED WITH EXPIRY TRACKING
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getPendingChallenges } from '../api/challengeService';
import type { Challenge } from '../types/challenge';
import { isChallengeExpired } from '../types/challenge';

interface ChallengeContextType {
    pendingCount: number;
    expiredCount: number;
    refreshChallenges: () => Promise<void>;
    isRefreshing: boolean;
}

const ChallengeContext = createContext<ChallengeContextType | undefined>(undefined);

export const ChallengeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [pendingCount, setPendingCount] = useState(0);
    const [expiredCount, setExpiredCount] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshChallenges = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const challenges = await getPendingChallenges();
            
            // Separate pending and expired challenges
            const activePending = challenges.filter(c => !isChallengeExpired(c));
            const expired = challenges.filter(c => isChallengeExpired(c));
            
            setPendingCount(activePending.length);
            setExpiredCount(expired.length);
        } catch (error) {
            console.error('[ChallengeContext] Failed to refresh challenges:', error);
            // Keep previous counts on error
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    // Initial fetch on mount
    useEffect(() => {
        refreshChallenges();
    }, [refreshChallenges]);

    // Auto-refresh every 2 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            refreshChallenges();
        }, 2 * 60 * 1000); // 2 minutes

        return () => clearInterval(interval);
    }, [refreshChallenges]);

    return (
        <ChallengeContext.Provider 
            value={{ 
                pendingCount, 
                expiredCount, 
                refreshChallenges, 
                isRefreshing 
            }}
        >
            {children}
        </ChallengeContext.Provider>
    );
};

export const useChallenges = () => {
    const context = useContext(ChallengeContext);
    if (!context) {
        throw new Error('useChallenges must be used within a ChallengeProvider');
    }
    return context;
};