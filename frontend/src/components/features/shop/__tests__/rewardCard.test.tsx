import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RewardCard } from '../rewardCard';
import type { RewardItem } from '@/types/shop';

describe('RewardCard Component', () => {
    const mockReward: RewardItem = {
        id: 101,
        name: 'Coffee Mug',
        description: 'Ceramic Mug',
        cost: 100,
        image: null,
        max_claims_per_user: 2
    };

    const mockOnClaim = vi.fn();

    it('renders reward details', () => {
        render(
            <RewardCard
                reward={mockReward}
                userPoints={500}
                onClaim={mockOnClaim}
                claimCount={0}
                maxClaims={2}
            />
        );

        expect(screen.getByText('Coffee Mug')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText(/Limit: 0 \/ 2/)).toBeInTheDocument();
    });

    it('enables button if user has enough points', () => {
        render(
            <RewardCard
                reward={mockReward}
                userPoints={100} // Exact cost
                onClaim={mockOnClaim}
                claimCount={0}
                maxClaims={2}
            />
        );

        const btn = screen.getByRole('button', { name: /Claim Reward/i });
        expect(btn).toBeEnabled();
    });

    it('disables button if user has insufficient points', () => {
        render(
            <RewardCard
                reward={mockReward}
                userPoints={99} // Not enough
                onClaim={mockOnClaim}
                claimCount={0}
                maxClaims={2}
            />
        );

        const btn = screen.getByRole('button');
        expect(btn).toBeDisabled();
        expect(screen.getByText('Not Enough Pts')).toBeInTheDocument();
    });

    it('disables button if claim limit reached', () => {
        render(
            <RewardCard
                reward={mockReward}
                userPoints={500}
                onClaim={mockOnClaim}
                claimCount={2} // Limit reached
                maxClaims={2}
            />
        );

        const btn = screen.getByRole('button');
        expect(btn).toBeDisabled();
        expect(screen.getByText('Limit Reached')).toBeInTheDocument();
    });

    it('handles successful claim interaction', async () => {
        mockOnClaim.mockResolvedValueOnce({ success: true, message: 'Enjoy your mug!' });

        render(
            <RewardCard
                reward={mockReward}
                userPoints={500}
                onClaim={mockOnClaim}
                claimCount={0}
                maxClaims={2}
            />
        );

        const btn = screen.getByRole('button', { name: /Claim Reward/i });
        fireEvent.click(btn);

        // Check loading state (optional, might happen too fast)
        // expect(screen.getByText('Claiming...')).toBeInTheDocument();

        await waitFor(() => {
            expect(mockOnClaim).toHaveBeenCalledWith(101);
            expect(screen.getByText('Claimed!')).toBeInTheDocument();
            expect(screen.getByText('Enjoy your mug!')).toBeInTheDocument();
        });
    });
});