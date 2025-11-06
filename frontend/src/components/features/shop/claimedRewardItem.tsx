// /src/components/features/ClaimedRewardItem.tsx
import React from 'react';
import type { ClaimedReward } from '../../../types'; // Adjust path if needed
import { API_URL } from '../../../api/authService'; // Adjust path if needed
import { Tag, Calendar, CheckCircle } from 'lucide-react';

// Helper to format date
const formatClaimDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

// Helper to build image URL
const buildImageUrl = (imagePath: string | null) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath; // Already a full URL
  // Use API_URL from your config
  return `${API_URL}${imagePath}`;
};

export const ClaimedRewardItem: React.FC<{ claim: ClaimedReward }> = ({
  claim,
}) => {
  const imageUrl = buildImageUrl(claim.reward.image);

  return (
    <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 flex items-start space-x-4">
      {/* Icon */}
      <div className="flex-shrink-0 pt-1">
        {claim.status === 'FULFILLED' || claim.status === 'CLAIMED' ? (
          <CheckCircle className="text-green-500" />
        ) : (
          <Tag className="text-gray-500" /> // Placeholder for 'PENDING'
        )}
      </div>

      {/* Details */}
      <div className="flex-grow">
        <h3 className="text-md font-semibold text-gray-800">
          {claim.reward.name}
        </h3>
        <p className="text-sm text-gray-600">{claim.reward.description}</p>
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            Claimed: {formatClaimDate(claim.claimed_at)}
          </span>
          <span className="font-medium text-gray-600">
            Cost: {claim.points_spent} pts
          </span>
          <span className="font-medium">
            Status: <span className="font-bold">{claim.status}</span>
          </span>
        </div>
      </div>

      {/* Image (Optional) */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={claim.reward.name}
          className="w-16 h-16 rounded-md object-cover flex-shrink-0 bg-gray-100"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }} // Hide if image fails
        />
      )}
    </div>
  );
};
