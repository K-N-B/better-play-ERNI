import React, { useState } from 'react';
import type { RewardItem, ClaimResponse } from '../../types'; // Adjust path if needed
import { LoadingSpinner } from '../ui/loadingSpinner'; // Adjust path if needed
import { Store, ShoppingCart, CheckCircle, XCircle, Star } from 'lucide-react';

// --- Reward Card Component ---
interface RewardCardProps {
  reward: RewardItem;
  userPoints: number;
  onClaim: (rewardId: RewardItem['id']) => Promise<ClaimResponse>; // Function passed from ShopPage
}

export const RewardCard: React.FC<RewardCardProps> = ({ reward, userPoints, onClaim }) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<'success' | 'error' | null>(null);
  const [message, setMessage] = useState('');
  const canAfford = userPoints >= reward.cost;

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

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col transition-shadow hover:shadow-lg">
      {/* Optional Image */}
      {reward.imageUrl ? (
        <img
          src={reward.imageUrl}
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
        {/* Footer with points and button */}
        <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-200">
          <span className="font-bold text-primary text-lg flex items-center gap-1">
            {reward.cost}
            <Star size={16} className="text-yellow-500 fill-current" />
          </span>
          <button
            onClick={handleClaim}
            disabled={!canAfford || isClaiming || claimStatus === 'success'}
            className={`px-3 py-1.5 rounded-xl text-xs sm:px-4 sm:py-2 sm:text-sm font-medium transition-transform duration-150 ease-in-out flex items-center gap-1.5
              ${!canAfford ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''}
              ${canAfford && !isClaiming && claimStatus !== 'success' ? 'bg-primary text-white hover:bg-primary-dark active:translate-y-px shadow-[0_5px_0_0] shadow-primary-700' : ''}
              ${isClaiming ? 'bg-gray-400 text-white cursor-wait' : ''}
              ${claimStatus === 'success' ? 'bg-green-500 text-white cursor-default' : ''}
              ${claimStatus === 'error' ? 'bg-red-500 text-white  hover:bg-red-600' : ''}
            `}
          >
            {isClaiming ? <LoadingSpinner size="sm" /> :
              claimStatus === 'success' ? <CheckCircle size={16} /> :
                claimStatus === 'error' ? <XCircle size={16} /> :
                  <ShoppingCart size={16} />}

            {isClaiming ? 'Claiming...' :
              claimStatus === 'success' ? 'Claimed!' :
                claimStatus === 'error' ? 'Retry?' :
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

// If using default exports:
// export default RewardCard;