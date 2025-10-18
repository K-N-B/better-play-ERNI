// Global state for your user. This is a critical file.
// What you need to do:
// Use the useMsal() hook to get the MSAL account info (like email).
// Create a state for your backend user profile (userProfile: UserProfile | null).
// When the user logs in (or on app load), call authService.getUserProfile().
// Store this userProfile in the context.
// Provide the MSAL user, your userProfile, and a refetchProfile() function to the entire app.
// Create a useAuth() hook to easily access this context.

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { UserProfile } from '../types/user';    
import { mockLogin } from '../api/authService';
import { LoadingSpinner } from '../components/ui/loadingSpinner';

// Define shape
interface AuthContextType {
    user: UserProfile | null;
    isLoading: boolean;
    login: (type: 'new' | 'existing') => Promise<void>;
    logout: () => void;
    refetchProfile: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define provider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // Can add check here if user is already logged in
    // For now, initial loading set to false
    useEffect(() => {
        setIsInitialLoading(false);
    }, []);

    // Simulated login
    const login = async (type: 'new' | 'existing') => {
        setIsLoading(true);
        const profile = await mockLogin(type);
        setUser(profile);
        setIsLoading(false);
    };

    const logout = () => {
        setUser(null);
    };

    // Allows modal to update user's profile in context
    const refreshProfile = async() => {
        // !! re-fetch /api/users/me

        // Simulate: successful profile completion
        if(user && !user.profile_complete) {
            setUser({...user, profile_complete: true, department: { id: 1, name: "Backend & Cloud"} });
        }
    };

    // Show spinner while checking auth status
    if (isInitialLoading) {
        return <LoadingSpinner fullPage={true} />;
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, refetchProfile: refreshProfile }}>
            {children}
        </AuthContext.Provider> 
    );

};

// Create custom hook
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be within an AuthProvider');
    }
    return context;
};



