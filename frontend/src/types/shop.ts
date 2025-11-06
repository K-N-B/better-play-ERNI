import type { UserProfile } from './user';

// Represents a single reward item available in the shop
export interface RewardItem {
  id: string | number;
  name: string;
  description: string;
  cost: number;
  image: string | null; // <-- Changed 'imageUrl' to 'image' and type to 'string | null'
  stock?: number; // Make stock optional
  max_claims_per_user: number | null;
}

export interface ClaimedReward {
  id: number;
  user: Pick<UserProfile, 'id' | 'username'>; // Or just user_id
  reward: RewardItem; // Can be nested or just reward_id
  claimed_at: string;
  points_spent: number;
  status: string;
}

// Optional: Type for the response when claiming a reward
export interface ClaimResponse {
  success: boolean;
  message: string;
  remainingPoints?: number; // Optional: Backend sends back updated points
}
