// /src/components/features/ShopHistoryModal.tsx
import React from 'react';
import type { ClaimedReward } from '../../../types'; // Adjust path
import { ClaimedRewardItem } from './claimedRewardItem'; // Adjust path
import { LoadingSpinner } from '../../ui/loadingSpinner'; // Adjust path
import { History, X } from 'lucide-react';

interface ShopHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Pass the data from the parent
  claimedRewards: ClaimedReward[] | null;
  loading: boolean;
  error: Error | null;
}

export const ShopHistoryModal: React.FC<ShopHistoryModalProps> = ({
  isOpen,
  onClose,
  claimedRewards,
  loading,
  error,
}) => {
  // This component no longer fetches its own data
  // It receives everything as props from ShopPage

  if (!isOpen) return null; // Don't render anything if not open

  return (
    // Modal Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 "
      onClick={onClose}
    >
      {/* Modal Content */}
      <div
        className="bg-white rounded-4xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Modal Header */}
        <div className="flex mt-5 px-8 pb-4 justify-between items-center shadow-md z-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <History className="text-primary" />
            Your Claim History
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto">
          {loading && (
            <div className="text-center py-10">
              <LoadingSpinner size="lg" />
            </div>
          )}
          {error && (
            <p className="text-center py-10 text-red-600 bg-red-50 p-4 rounded-lg">
              Could not load your claim history.
            </p>
          )}
          {!loading && !error && claimedRewards && (
            <div className="space-y-4">
              {claimedRewards.length > 0 ? (
                // Sort by date, newest first
                [...claimedRewards]
                  .sort(
                    (a, b) =>
                      new Date(b.claimed_at).getTime() -
                      new Date(a.claimed_at).getTime(),
                  )
                  .map((claim) => (
                    <ClaimedRewardItem key={claim.id} claim={claim} />
                  ))
              ) : (
                <p className="text-center py-10 text-gray-500">
                  You haven't claimed any rewards yet.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
