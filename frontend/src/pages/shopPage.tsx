// /src/pages/ShopPage.tsx

import React, { useState, useCallback } from 'react';
import { useAuth } from '../hooks/authContext'; // Adjust path if needed
import { useApi } from '../hooks/useApi'; // Adjust path if needed
import { getRewards, claimReward } from '../api/shopService'; // Adjust path if needed
import type { RewardItem, ClaimResponse } from '../types'; // Adjust path if needed
import { LoadingSpinner } from '../components/ui/loadingSpinner'; // Adjust path if needed
import { Store, ShoppingCart, CheckCircle, XCircle, Star } from 'lucide-react'; // Import icons

// --- Reward Card Component ---
interface RewardCardProps {
  reward: RewardItem;
  userPoints: number;
  // Make onClaim accept rewardId and return the ClaimResponse promise
  onClaim: (rewardId: RewardItem['id']) => Promise<ClaimResponse>;
}

const RewardCard: React.FC<RewardCardProps> = ({ reward, userPoints, onClaim }) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<'success' | 'error' | null>(null);
  const [message, setMessage] = useState('');
  const canAfford = userPoints >= reward.cost;

  const handleClaim = async () => {
    setIsClaiming(true);
    setClaimStatus(null); // Reset status on new claim attempt
    setMessage('');
    try {
      // Call the passed-in onClaim function
      const response = await onClaim(reward.id);
      setMessage(response.message); // Set message from API response
      setClaimStatus(response.success ? 'success' : 'error'); // Set status based on API response

      // Optional: Automatically clear status message after a few seconds
      if (response.success || response.success === false) { // Check if response received
          setTimeout(() => {
              setClaimStatus(null);
              setMessage('');
          }, 3000); // Clear after 3 seconds
      }

    } catch (err: any) {
      // Handle errors thrown by the onClaim function (e.g., network error)
      setMessage(err.message || 'Failed to claim reward due to an unexpected error.');
      setClaimStatus('error');
      setTimeout(() => {
          setClaimStatus(null);
          setMessage('');
      }, 3000); // Clear after 3 seconds
    } finally {
      setIsClaiming(false); // Stop loading indicator
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col transition-shadow hover:shadow-lg">
      {/* Optional Image */}
      {reward.imageUrl ? (
         <img
            src={reward.imageUrl}
            alt={reward.name}
            className="w-full h-40 object-cover bg-gray-100" // Added background color
            // Basic error handling for images
            onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/300x200/e2e8f0/94a3b8?text=Image+Unavailable'; // Placeholder on error
                e.currentTarget.alt = `${reward.name} (Image Unavailable)`;
            }}
         />
      ) : (
         // Placeholder if no image URL is provided
         <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">
            <Store size={48} />
         </div>
      )}
      {/* Card Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold mb-1 text-gray-800">{reward.name}</h3>
        <p className="text-sm text-gray-600 mb-3 flex-grow">{reward.description}</p>
        {/* Footer with points and button */}
        <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-200">
          <span className="font-bold text-primary text-lg flex items-center gap-1">
            <Star size={16} className="text-yellow-500 fill-current" />
            {reward.cost}
          </span>
          <button
            onClick={handleClaim}
            // Disable logic: Cannot afford OR currently claiming OR successfully claimed
            disabled={!canAfford || isClaiming || claimStatus === 'success'}
            className={`px-3 py-1.5 rounded text-xs sm:px-4 sm:py-2 sm:text-sm font-medium transition-all duration-150 ease-in-out flex items-center gap-1.5 shadow-sm border
              ${!canAfford ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed' : ''}
              ${canAfford && !isClaiming && claimStatus !== 'success' ? 'bg-primary text-white border-primary-dark hover:bg-primary-dark active:translate-y-px' : ''}
              ${isClaiming ? 'bg-gray-400 text-white border-gray-500 cursor-wait' : ''}
              ${claimStatus === 'success' ? 'bg-green-500 text-white border-green-600 cursor-default' : ''}
              ${claimStatus === 'error' ? 'bg-red-500 text-white border-red-600 hover:bg-red-600' : ''}
            `}
          >
            {/* Dynamically change icon and text based on state */}
            {isClaiming ? <LoadingSpinner /> :
             claimStatus === 'success' ? <CheckCircle size={16}/> :
             claimStatus === 'error' ? <XCircle size={16}/> :
             <ShoppingCart size={16}/>}

            {isClaiming ? 'Claiming...' :
             claimStatus === 'success' ? 'Claimed!' :
             claimStatus === 'error' ? 'Retry?' : // Or just 'Failed'
             canAfford ? 'Claim Reward' : 'Not Enough Pts'}
          </button>
        </div>
        {/* Show claim status message */}
        {message && (
            <p className={`text-xs mt-2 text-center font-medium h-4 ${claimStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message}</p>
        )}
      </div>
    </div>
  );
};


// --- Shop Page Component ---
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
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Store className="text-primary"/> Shop & Rewards
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