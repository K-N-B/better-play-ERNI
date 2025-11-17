// frontend/src/types/challenge.ts - UPDATED WITH EXPIRY FIELDS
import type { UserProfile } from './user';

export type ChallengeStatus = 'PENDING' | 'COMPLETED' | 'EXPIRED'; // ✅ Added EXPIRED

// ✅ Extended submission info to include difficulty
export interface ChallengeSubmission {
    id: number;
    points_awarded: number;
    time_taken_ms: number;
    tries: number;
    difficulty: 'easy' | 'hard';
}

// Data structure for a challenge object received from the backend
export interface Challenge {
    id: number;
    challenger: Pick<UserProfile, 'id' | 'username'>;
    recipient: Pick<UserProfile, 'id' | 'username'>;
    puzzle_type: 'wordle' | 'sudoku' | 'ernigram';
    puzzle_id: number;
    challenger_submission: ChallengeSubmission;
    recipient_submission: ChallengeSubmission | null;
    status: ChallengeStatus;
    winner: Pick<UserProfile, 'id' | 'username'> | null;
    created_at: string;
    expires_at?: string;      // ✅ NEW: Expiration timestamp
    completed_at?: string;    // ✅ NEW: Completion timestamp
}

// Data structure for creating a challenge (sending to backend)
export interface CreateChallengeData {
    recipient_id: number;
    submission_id: number;
}

// Data structure for completing a challenge (sending to backend)
export interface CompleteChallengeData {
    submission_id: number;
}

// ✅ NEW: Helper function to check if challenge is expired
export const isChallengeExpired = (challenge: Challenge): boolean => {
    if (challenge.status !== 'PENDING') return false;
    if (!challenge.expires_at) return false;
    
    const now = new Date();
    const expires = new Date(challenge.expires_at);
    
    return now > expires;
};

// ✅ NEW: Helper function to format time remaining
export const formatTimeRemaining = (expiresAt: string): string => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes}m remaining`;
    } else if (diffMinutes > 0) {
        return `${diffMinutes}m remaining`;
    } else {
        return 'Less than 1m remaining';
    }
};

// ✅ NEW: Helper function to get expiry status with urgency level
export const getChallengeExpiryStatus = (challenge: Challenge): {
    isExpired: boolean;
    timeRemaining: string | null;
    urgency: 'safe' | 'warning' | 'critical' | 'expired';
} => {
    if (challenge.status !== 'PENDING' || !challenge.expires_at) {
        return {
            isExpired: false,
            timeRemaining: null,
            urgency: 'safe',
        };
    }

    const now = new Date();
    const expires = new Date(challenge.expires_at);
    const diffMs = expires.getTime() - now.getTime();

    if (diffMs <= 0) {
        return {
            isExpired: true,
            timeRemaining: 'Expired',
            urgency: 'expired',
        };
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    let timeRemaining: string;
    let urgency: 'safe' | 'warning' | 'critical' | 'expired';

    if (diffHours > 3) {
        timeRemaining = `${diffHours}h remaining`;
        urgency = 'safe';
    } else if (diffHours > 1) {
        timeRemaining = `${diffHours}h ${diffMinutes}m remaining`;
        urgency = 'warning';
    } else if (diffMinutes > 0) {
        timeRemaining = `${diffMinutes}m remaining`;
        urgency = 'critical';
    } else {
        timeRemaining = 'Less than 1m remaining';
        urgency = 'critical';
    }

    return {
        isExpired: false,
        timeRemaining,
        urgency,
    };
};

// ✅ NEW: Helper function to get urgency color classes
export const getUrgencyColorClasses = (urgency: 'safe' | 'warning' | 'critical' | 'expired'): {
    text: string;
    bg: string;
    border: string;
} => {
    switch (urgency) {
        case 'safe':
            return {
                text: 'text-blue-600',
                bg: 'bg-blue-50',
                border: 'border-blue-200',
            };
        case 'warning':
            return {
                text: 'text-orange-600',
                bg: 'bg-orange-50',
                border: 'border-orange-200',
            };
        case 'critical':
            return {
                text: 'text-red-600',
                bg: 'bg-red-50',
                border: 'border-red-200',
            };
        case 'expired':
            return {
                text: 'text-gray-600',
                bg: 'bg-gray-50',
                border: 'border-gray-200',
            };
        default:
            return {
                text: 'text-blue-600',
                bg: 'bg-blue-50',
                border: 'border-blue-200',
            };
    }
};