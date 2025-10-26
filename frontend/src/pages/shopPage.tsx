// /src/pages/ShopPage.tsx

import { useCallback } from 'react';
import { useAuth } from '../hooks/authContext'; // Adjust path if needed
import { useApi } from '../hooks/useApi'; // Adjust path if needed
import { getRewards, claimReward } from '../api/shopService'; // Adjust path if needed
import type { RewardItem, ClaimResponse } from '../types'; // Adjust path if needed
import { LoadingSpinner } from '../components/ui/loadingSpinner'; // Adjust path if needed
import { Store } from 'lucide-react'; // Import icons
import { RewardCard } from '../components/features/rewardCard';

export const ShopPage = () => {
  // Get user data and point update function from Auth Context
  const { user, isLoading: userLoading, updateUserPoints } = useAuth();
  // Fetch rewards using useApi hook
  const fetchRewardsData = useCallback(() => getRewards(), []);
  const { data: rewards, loading: rewardsLoading, error } = useApi(fetchRewardsData);

  // Determine overall loading state and get user points
  const isLoading = userLoading || rewardsLoading;
  const userPoints = user?.current_points ?? 0;

  // Memoized claim function to pass down to RewardCard
  const handleClaimReward = useCallback(async (rewardId: RewardItem['id']): Promise<ClaimResponse> => {
     try {
       // Pass the user's current points ONLY IF using the mock API
       // The real API determines points on the backend based on the user's session
       const response = await claimReward(rewardId, userPoints); // Pass userPoints for mock

       // If claim was successful AND the API returned remaining points
       if (response.success && typeof response.remainingPoints === 'number') {
           // Update the global user state in AuthContext
           if (updateUserPoints) { // Check if function exists
               updateUserPoints(response.remainingPoints);
               console.log("[ShopPage] User points updated in context.");
           } else {
                console.warn("[ShopPage] updateUserPoints function not found in AuthContext.");
           }
       }
       return response; // Return the response for the RewardCard to display message
     } catch (err) {
         console.error("[ShopPage] Claim failed:", err);
         // Return a structured failure response for the RewardCard
         return { success: false, message: err instanceof Error ? err.message : "Claim failed." };
     }
  }, [userPoints, updateUserPoints]); // Dependencies for the callback


  return (
    <div className="container rounded-4xl mx-auto p-4 sm:p-8 md:p-12 bg-yellow-50 h-full shadow-md overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Store className="text-yellow-600" size={40}/> Shop & Rewards
        </h1>
        {/* Display User Points (show loading state if user isn't loaded yet) */}
        <div className={`px-4 py-2 rounded-full font-semibold shadow-inner transition-colors ${userLoading ? 'bg-gray-200 text-gray-500 animate-pulse' : 'bg-yellow-100 text-yellow-800'}`}>
            Your Points: {userLoading ? '...' : `${userPoints} pts`}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && !rewards && ( // Show main loader only if rewards haven't loaded at all
          <div className="text-center py-20">
              <LoadingSpinner />
              <p className="mt-2 text-gray-500">Loading Rewards...</p>
          </div>
      )}

      {/* Error State */}
      {error && (
          <p className="text-center py-20 text-red-600 bg-red-50 p-4 rounded-lg">
              Could not load rewards. Please try again later. <br/>
              <span className="text-sm">({error.message})</span>
          </p>
      )}

      {/* Rewards Grid */}
      {!isLoading && !error && rewards && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {rewards.map(reward => (
            <RewardCard
              key={reward.id}
              reward={reward}
              userPoints={userPoints} // Pass current points
              onClaim={handleClaimReward} // Pass the claim handler
            />
          ))}
        </div>
      )}

      {/* No Rewards Message */}
       {!isLoading && !error && (!rewards || rewards.length === 0) && (
             <p className="text-center py-20 text-gray-500">
                 No rewards available at the moment. Check back later!
             </p>
       )}
    </div>
  );
}