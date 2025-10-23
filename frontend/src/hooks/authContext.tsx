// /src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { UserProfile } from '../types/user';
// Import the REAL service functions
import { checkAuth, logoutUser, completeProfile } from '../api/authService';
import { LoadingSpinner } from '../components/ui/loadingSpinner';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean; // Single loading state for initial auth check
  logout: () => Promise<void>; // Make logout async
  // Renamed refreshProfile to submitProfileCompletion for clarity
  submitProfileCompletion: (departmentId: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start true for initial check

  // Check authentication status when the app loads
  useEffect(() => {
    const validateSession = async () => {
      setIsLoading(true); // Ensure loading is true during check
      try {
        const data = await checkAuth(); // Call the real checkAuth
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth check failed on load:", err);
        setUser(null);
      } finally {
        setIsLoading(false); // Finished loading
      }
    };
    validateSession();
  }, []); // Empty array = run once on mount

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true); // Optional: show loading during logout
    try {
      await logoutUser(); // Call the real logout API
      setUser(null); // Clear user state immediately
      // No need for window.location here, ProtectedRoute handles redirect
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function called by FirstTimeSetupModal
  const submitProfileCompletion = useCallback(async (departmentId: number) => {
    // Note: Still potentially uses mock 'completeProfile' based on MOCK_MODE
    try {
      const updatedUser = await completeProfile(departmentId);
      // Update the user state in React with the response
      setUser(updatedUser);
    } catch (err) {
      console.error("Failed to update profile", err);
      // Maybe show an error message to the user?
    }
  }, []); // No dependencies needed if 'completeProfile' is stable

  // Show a full-page spinner ONLY during the initial auth check
  if (isLoading) {
    return <LoadingSpinner fullPage={true} />;
  }

  // Pass down the real user data and functions
  return (
    <AuthContext.Provider value={{ user, isLoading: false, logout, submitProfileCompletion }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};