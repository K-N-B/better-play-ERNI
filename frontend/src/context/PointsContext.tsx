// src/context/PointsContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// import { getUserPoints } from '../api/userService'; // You need an API call to get user profile/points

interface PointsContextType {
    points: number;
    refreshPoints: () => Promise<void>;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export const PointsProvider = ({ children }: { children: React.ReactNode }) => {
    const [points, setPoints] = useState(0);

    // Define how to fetch points from your backend
    const refreshPoints = useCallback(async () => {
        try {
            // Replace this with your actual API call to get the user's total points
            // const response = await getUserPoints(); 
            // setPoints(response.total_points);

            console.log("Refetching points..."); // Debugging
            // For now, we will simulate a fetch or you can implement the API call here
        } catch (error) {
            console.error("Failed to fetch points", error);
        }
    }, []);

    // Fetch initial points on mount
    useEffect(() => {
        refreshPoints();
    }, [refreshPoints]);

    return (
        <PointsContext.Provider value={{ points, refreshPoints }}>
            {children}
        </PointsContext.Provider>
    );
};

export const usePoints = () => {
    const context = useContext(PointsContext);
    if (!context) {
        throw new Error('usePoints must be used within a PointsProvider');
    }
    return context;
};