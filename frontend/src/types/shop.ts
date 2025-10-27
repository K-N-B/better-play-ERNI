// Represents a single reward item available in the shop
export interface RewardItem {
    id: string | number;
    name: string;
    description: string;
    cost: number;
    image: string | null; // <-- Changed 'imageUrl' to 'image' and type to 'string | null'
    stock?: number; // Make stock optional
}

// Optional: Type for the response when claiming a reward
export interface ClaimResponse {
    success: boolean;
    message: string;
    remainingPoints?: number; // Optional: Backend sends back updated points
}