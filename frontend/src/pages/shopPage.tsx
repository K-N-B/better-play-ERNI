// /src/pages/ShopPage.tsx

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/authContext'; // Adjust path if needed
import { useApi } from '../hooks/useApi'; // Adjust path if needed
import { getRewards, claimReward, getClaimedRewards } from '../api/shopService'; // Adjust path if needed
import type { RewardItem, ClaimResponse, ClaimedReward } from '../types'; // Adjust path if needed
import { LoadingSpinner } from '../components/ui/loadingSpinner'; // Adjust path if needed
import { ShopHistoryModal } from '../components/features/shop/shopHistoryModal';
import { Store, Star, History } from 'lucide-react'; // Import icons
import { RewardCard } from '../components/features/shop/rewardCard';

export const ShopPage = () => {
  const { user, isLoading: userLoading, updateUserPoints } = useAuth();

  // --- Fetch both rewards and claim history ---
  const fetchRewardsData = useCallback(() => getRewards(), []);
  const { data: rewards, loading: rewardsLoading, error: rewardsError } = useApi(fetchRewardsData);

  const fetchClaimsData = useCallback(() => getClaimedRewards(), []);
  const { data: claimedRewards, loading: claimsLoading, error: claimsError } = useApi(fetchClaimsData);
  // ---

  // --- Calculate claim counts ---
  // useMemo will re-calculate this map only when claimedRewards changes
  const claimCounts = useMemo(() => {
    const counts: Record<RewardItem['id'], number> = {};
    if (claimedRewards) {
      for (const claim of claimedRewards) {
        const rewardId = claim.reward.id;
        counts[rewardId] = (counts[rewardId] || 0) + 1;
      }
    }
    console.log("Calculated claim counts:", counts);
    return counts;
  }, [claimedRewards]);
  // ---
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const isLoading = userLoading || rewardsLoading || claimsLoading; // Check all loading states
  const error = rewardsError || claimsError;
  const userPoints = user?.current_points ?? 0;

  const handleClaimReward = useCallback(async (rewardId: RewardItem['id']): Promise<ClaimResponse> => {
    try {
      // Pass the user's current points ONLY IF using the mock API
      // The real API determines points on the backend based on the user's session
      const response = await claimReward(rewardId); // Pass userPoints for mock

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
        <h1 className="text-3xl font-bold text-black flex items-center gap-2">
          <Store className="text-black" size={40} /> Shop & Rewards
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsHistoryModalOpen(true)} // Open modal
            className="flex gap-2 shrink-0 p-4 text-sky-600 hover:text-primary font-semibold rounded-full hover:bg-gray-100 transition-colors"
            title="View Claim History"
          >
            <History size={20} /> Claim History
          </button>
          {/* Display User Points (show loading state if user isn't loaded yet) */}
          <span className={`flex items-center gap-1 px-4 py-2 rounded-full font-bold shadow-inner transition-colors ${userLoading ? 'bg-gray-200 text-gray-500 animate-pulse' : 'bg-yellow-100 text-yellow-800'}`}>
            Your Points: {userLoading ? '...' : `${userPoints}`} <Star size={16} className="text-yellow-500 fill-current" />
          </span>
        </div>

      </div>

      {/* Loading State */}
      {isLoading && !rewards && ( // Show main loader only if rewards haven't loaded at all
        <div className="flex text-center items-center justify-center py-20 gap-2">
          <LoadingSpinner />
          <p className=" text-gray-500">Loading Rewards...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <p className="text-center py-20 text-red-600 bg-red-50 p-4 rounded-lg">
          Could not load rewards. Please try again later. <br />
          <span className="text-sm">({error.message})</span>
        </p>
      )}

      {/* Rewards Grid */}
      {!isLoading && !error && rewards && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {rewards.map(reward => {
            // Get the count for this specific reward
            const count = claimCounts[reward.id] || 0;
            return (
              <RewardCard
                key={reward.id}
                reward={reward}
                userPoints={userPoints}
                onClaim={handleClaimReward}
                // --- Pass new props down ---
                claimCount={count}
                maxClaims={reward.max_claims_per_user}
              // ---
              />
            );
          })}
        </div>
      )}

      {/* No Rewards Message */}
      {!isLoading && !error && (!rewards || rewards.length === 0) && (
        <p className="text-center py-20 text-gray-500">
          No rewards available at the moment. Check back later!
        </p>
      )}

      <ShopHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        claimedRewards={claimedRewards} // Pass the fetched data
        loading={claimsLoading} // Pass the loading state
        error={claimsError} // Pass the error state
      />
    </div>
  );
}