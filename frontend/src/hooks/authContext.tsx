// Global state for your user. This is a critical file.
// What you need to do:
// Use the useMsal() hook to get the MSAL account info (like email).
// Create a state for your backend user profile (userProfile: UserProfile | null).
// When the user logs in (or on app load), call authService.getUserProfile().
// Store this userProfile in the context.
// Provide the MSAL user, your userProfile, and a refetchProfile() function to the entire app.
// Create a useAuth() hook to easily access this context.
// Global state for your user. This is a critical file.
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { UserProfile } from '../types/user';
import { checkAuth, logoutUser, completeProfile } from '../api/authService';
import { LoadingSpinner } from '../components/ui/loadingSpinner';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  logout: () => Promise<void>; // Change to return a Promise<void> to reflect async nature
  submitProfileCompletion: (departmentId: number) => Promise<void>;
  updateUserPoints: (newPoints: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // This runs ONCE when the app loads
  useEffect(() => {
    const validateSession = async () => {
      try {
        const data = await checkAuth();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    validateSession();
  }, []); // Empty array = run once on mount

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true); // Show a loading state
    try {
      await logoutUser(); // Call the API to destroy the cookie (now sends CSRF)
      // Only clear state if API call succeeds
      setUser(null); 
    } catch (error) {
      console.error("Logout failed:", error);
      // If logout fails, we *might* still be authenticated, so re-check or just clear state for safety
      setUser(null); // Force clear the state anyway to redirect user
    } finally {
      setIsLoading(false);
    }
  }, []);

  // This is for the FirstTimeSetupModal
  const submitProfileCompletion = useCallback(async (departmentId: number) => {
    try {
      // Call the API to update the backend
      const updatedUser = await completeProfile(departmentId);
      // Update the user state in React
      setUser(updatedUser);
    } catch (err) {
      console.error("Failed to update profile", err);
      // Re-fetch user or handle error state if needed
      throw err;
    }
  }, []);

  const updateUserPoints = useCallback((newPoints: number) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      return { ...currentUser, current_points: newPoints }; // Update only current_points
    });
  }, []);

  // Show a full-page spinner while checking auth
  if (isLoading) {
    return <LoadingSpinner fullPage={true} />;
  }

  // Pass down the real user data and functions
  return (
    <AuthContext.Provider value={{ user, isLoading, logout, submitProfileCompletion, updateUserPoints }}>
      {children}
    </AuthContext.Provider>
  );
};

// The hook remains the same
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};