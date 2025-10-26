// Represents a single reward item available in the shop
export interface RewardItem {
    id: string | number; // Unique identifier
    name: string;
    description: string;
    cost: number; // Points required to claim
    imageUrl?: string; // Optional image for the reward
    // Add other relevant fields if needed (e.g., stock, category)
}

// Optional: Type for the response when claiming a reward
export interface ClaimResponse {
    success: boolean;
    message: string;
    remainingPoints?: number; // Optional: Backend sends back updated points
}