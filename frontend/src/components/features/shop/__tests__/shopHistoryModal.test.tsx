import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ShopHistoryModal } from '../shopHistoryModal';
import type { ClaimedReward } from '@/types/shop';

// Mock the child component
vi.mock('../claimedRewardItem', () => ({
    ClaimedRewardItem: ({ claim }: { claim: ClaimedReward }) => (
        <div data-testid="history-item">{claim.reward.name}</div>
    )
}));

describe('ShopHistoryModal Component', () => {
    const mockOnClose = vi.fn();
    const mockClaims: ClaimedReward[] = [
        {
            id: 1,
            user: { id: 1, username: 'Alice' },
            reward: { id: 101, name: 'Sticker', description: '', cost: 50, image: null, max_claims_per_user: null },
            claimed_at: '2023-01-01',
            points_spent: 50,
            status: 'FULFILLED'
        }
    ];

    it('does not render when closed', () => {
        render(
            <ShopHistoryModal
                isOpen={false}
                onClose={mockOnClose}
                claimedRewards={[]}
                loading={false}
                error={null}
            />
        );
        expect(screen.queryByText(/Your Claim History/)).not.toBeInTheDocument();
    });

    it('renders list of claims when open', () => {
        render(
            <ShopHistoryModal
                isOpen={true}
                onClose={mockOnClose}
                claimedRewards={mockClaims}
                loading={false}
                error={null}
            />
        );

        expect(screen.getByText(/Your Claim History/)).toBeInTheDocument();
        expect(screen.getByTestId('history-item')).toHaveTextContent('Sticker');
    });

    it('shows empty state message', () => {
        render(
            <ShopHistoryModal
                isOpen={true}
                onClose={mockOnClose}
                claimedRewards={[]}
                loading={false}
                error={null}
            />
        );

        expect(screen.getByText(/You haven't claimed any rewards yet/)).toBeInTheDocument();
    });
});