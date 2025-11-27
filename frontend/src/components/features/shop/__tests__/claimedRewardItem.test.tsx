import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ClaimedRewardItem } from '../claimedRewardItem';
import type { ClaimedReward } from '@/types/shop';

describe('ClaimedRewardItem Component', () => {
    const mockClaim: ClaimedReward = {
        id: 1,
        user: { id: 1, username: 'Alice' },
        reward: {
            id: 101,
            name: 'Cool Sticker',
            description: 'A shiny sticker',
            cost: 50,
            image: null,
            max_claims_per_user: null
        },
        claimed_at: '2023-01-01T12:00:00Z',
        points_spent: 50,
        status: 'FULFILLED'
    };

    it('renders reward details correctly', () => {
        render(<ClaimedRewardItem claim={mockClaim} />);

        expect(screen.getByText('Cool Sticker')).toBeInTheDocument();
        expect(screen.getByText('A shiny sticker')).toBeInTheDocument();
        expect(screen.getByText(/Cost: 50 pts/)).toBeInTheDocument();
        expect(screen.getByText('FULFILLED')).toBeInTheDocument();
    });

    it('renders pending status correctly', () => {
        const pendingClaim = { ...mockClaim, status: 'PENDING' };
        render(<ClaimedRewardItem claim={pendingClaim} />);

        expect(screen.getByText('PENDING')).toBeInTheDocument();
    });
});