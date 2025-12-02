// src/hooks/authContext.tsx

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { UserProfile } from '../types/user';
import { checkAuth, logoutUser, completeProfile } from '../api/authService';
import { LoadingSpinner } from '../components/ui/loadingSpinner';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  submitProfileCompletion: (departmentId: number) => Promise<void>;
  updateUserPoints: (newPoints: number) => void;
  refreshUser: () => Promise<void>; // <--- 1. ADD THIS
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 2. CREATE THE REUSABLE FUNCTION
  // We use useCallback so this function is stable
  const refreshUser = useCallback(async () => {
    try {
      // Note: We do NOT set setIsLoading(true) here, 
      // because we don't want the whole screen to go white/spinner 
      // when updating points in the background.
      const data = await checkAuth();
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        // Optional: Only clear user if you want strict validation on every refresh
        // setUser(null); 
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  }, []);

  // 3. UPDATE USEEFFECT TO USE THE FUNCTION
  useEffect(() => {
    const initAuth = async () => {
      await refreshUser();
      setIsLoading(false); // Only turn off loading on the initial mount
    };
    initAuth();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitProfileCompletion = useCallback(async (departmentId: number) => {
    try {
      const updatedUser = await completeProfile(departmentId);
      setUser(updatedUser);
    } catch (err) {
      console.error("Failed to update profile", err);
      throw err;
    }
  }, []);

  const updateUserPoints = useCallback((newPoints: number) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      return { ...currentUser, current_points: newPoints };
    });
  }, []);

  if (isLoading) {
    return <LoadingSpinner fullPage={true} />;
  }

  // 4. ADD refreshUser TO THE VALUE OBJECT
  return (
    <AuthContext.Provider value={{ 
        user, 
        isLoading, 
        logout, 
        submitProfileCompletion, 
        updateUserPoints, 
        refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};