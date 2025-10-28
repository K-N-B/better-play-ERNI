import React, { useState } from 'react';
import type { RewardItem, ClaimResponse } from '../../../types'; // Adjust path if needed
import { LoadingSpinner } from '../../ui/loadingSpinner'; // Adjust path if needed
import { Store, ShoppingCart, CheckCircle, XCircle, Star, Repeat } from 'lucide-react';
import clsx from 'clsx';

// --- Reward Card Component ---
interface RewardCardProps {
  reward: RewardItem;
  userPoints: number;
  onClaim: (rewardId: RewardItem['id']) => Promise<ClaimResponse>; // Function passed from ShopPage
  claimCount: number;
  maxClaims: number | null;
}

export const RewardCard: React.FC<RewardCardProps> = ({ reward, userPoints, onClaim, claimCount, // <-- Destructure
  maxClaims, }) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<'success' | 'error' | null>(null);
  const [message, setMessage] = useState('');
  const canAfford = userPoints >= reward.cost;

  const isClaimLimitReached = maxClaims !== null && claimCount >= maxClaims;


  const handleClaim = async () => {
    setIsClaiming(true);
    setClaimStatus(null);
    setMessage('');
    try {
      const response = await onClaim(reward.id);
      setMessage(response.message);
      setClaimStatus(response.success ? 'success' : 'error');
      if (response.success || response.success === false) {
        setTimeout(() => {
          setClaimStatus(null);
          setMessage('');
        }, 3000);
      }
    } catch (err: any) {
      setMessage(err.message || 'Failed to claim reward due to an unexpected error.');
      setClaimStatus('error');
      setTimeout(() => {
        setClaimStatus(null);
        setMessage('');
      }, 3000);
    } finally {
      setIsClaiming(false);
    }
  };

  // --- Determine button text and state ---
  let buttonText = 'Claim Reward';
  let buttonIcon = <ShoppingCart size={16} />;
  let buttonDisabled = !canAfford || isClaiming || claimStatus === 'success';

  if (isClaiming) {
    buttonText = 'Claiming...';
    buttonIcon = <LoadingSpinner size="xs" />; // Use small spinner
  } else if (claimStatus === 'success') {
    buttonText = 'Claimed!';
    buttonIcon = <CheckCircle size={16} />;
  } else if (claimStatus === 'error') {
    buttonText = 'Retry?';
    buttonIcon = <XCircle size={16} />;
    buttonDisabled = false; // Allow retry
  } else if (isClaimLimitReached) { // Check this *before* canAfford
    buttonText = 'Limit Reached';
    buttonIcon = <XCircle size={16} />;
    buttonDisabled = true; // Hard disable
  } else if (!canAfford) {
    buttonText = 'Not Enough Pts';
    buttonDisabled = true;
  }
  // ---

  return (
    <div className={clsx("bg-white rounded-2xl shadow-md overflow-hidden flex flex-col transition-shadow hover:shadow-lg",
      isClaimLimitReached && "opacity-70 bg-gray-50" // Fade if limit reached>
    )}>
      {/* Optional Image */}
      {reward.image ? (
        <img
          src={reward.image}
          alt={reward.name}
          className="w-full h-40 object-cover bg-gray-100"
          onError={(e) => {
            e.currentTarget.src = 'https://placehold.co/300x200/e2e8f0/94a3b8?text=Image+Unavailable';
            e.currentTarget.alt = `${reward.name} (Image Unavailable)`;
          }}
        />
      ) : (
        <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">
          <Store size={48} />
        </div>
      )}
      {/* Card Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold mb-1 text-gray-800">{reward.name}</h3>
        <p className="text-sm text-gray-600 mb-3 flex-grow">{reward.description}</p>
        {maxClaims !== null && (
          <div className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1">
            <Repeat size={12} />
            <span>Limit: {claimCount} / {maxClaims}</span>
          </div>
        )}
        {/* Footer with points and button */}
        <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-200">
          <span className="font-bold text-primary text-lg flex items-center gap-1">
            {reward.cost}
            <Star size={16} className="text-yellow-500 fill-current" />
          </span>
          <button
            onClick={handleClaim}
            disabled={buttonDisabled}
            className={clsx(
              "px-3 py-1.5 rounded-xl text-xs sm:px-4 sm:py-2 sm:text-sm font-medium transition-all duration-150 ease-in-out flex items-center gap-1.5 shadow-sm",
              // All other styles remain the same
              !canAfford ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed' : '',
              canAfford && !isClaiming && claimStatus !== 'success' && !isClaimLimitReached ? 'bg-primary text-white border-primary-dark hover:bg-primary-dark active:translate-y-px' : '',
              isClaiming ? 'bg-gray-400 text-white border-gray-500 cursor-wait' : '',
              claimStatus === 'success' ? 'bg-green-500 text-white border-green-600 cursor-default' : '',
              claimStatus === 'error' ? 'bg-red-500 text-white border-red-600 hover:bg-red-600' : '',
              isClaimLimitReached ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed' : '' // Style for limit reached
            )}
          >
            {buttonIcon}
            <span>{buttonText}</span>
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

// If using default exports:
// export default RewardCard;