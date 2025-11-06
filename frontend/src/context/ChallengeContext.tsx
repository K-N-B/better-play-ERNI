// src/context/ChallengeContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { getPendingChallenges } from '../api/challengeService';
import { useAuth } from '../hooks/authContext';

interface ChallengeContextType {
  pendingCount: number;
  isLoading: boolean;
  refreshChallenges: () => Promise<void>;
}

const ChallengeContext = createContext<ChallengeContextType | undefined>(
  undefined,
);

export const ChallengeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshChallenges = useCallback(async () => {
    try {
      console.log('[ChallengeContext] Fetching pending challenges...');
      const challenges = await getPendingChallenges();
      console.log(
        '[ChallengeContext] Found',
        challenges.length,
        'pending challenges',
      );
      setPendingCount(challenges.length);
      setIsLoading(false);
    } catch (error) {
      console.error('[ChallengeContext] Error fetching challenges:', error);
      setPendingCount(0);
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    refreshChallenges();
  }, [refreshChallenges]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const intervalId = setInterval(refreshChallenges, 60000);
    return () => clearInterval(intervalId);
  }, [refreshChallenges]);

  return (
    <ChallengeContext.Provider
      value={{ pendingCount, isLoading, refreshChallenges }}
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
