import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChallengeIcon } from '../challengeIcon';
import { MemoryRouter } from 'react-router-dom';
import * as challengeService from '@/api/challengeService';

// --- Mocks ---
vi.mock('@/api/challengeService', () => ({
    getPendingChallenges: vi.fn()
}));

describe('ChallengeIcon Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderWithRouter = (path = '/') => {
        return render(
            <MemoryRouter initialEntries={[path]}>
                <ChallengeIcon />
            </MemoryRouter>
        );
    };

    it('renders without badge when count is 0', async () => {
        // Mock 0 challenges
        vi.mocked(challengeService.getPendingChallenges).mockResolvedValue([]);

        renderWithRouter();

        // Wait for loading to finish
        // (You might see a loading ping initially, but eventually it settles)
        await waitFor(() => {
            // Link should be present
            expect(screen.getByRole('link')).toBeInTheDocument();
            // "0" badge should NOT be visible (component logic: !isLoading && count > 0)
            expect(screen.queryByText('0')).not.toBeInTheDocument();
        });
    });

    it('displays badge count correctly (e.g., 5)', async () => {
        // Mock 5 items
        vi.mocked(challengeService.getPendingChallenges).mockResolvedValue(new Array(5).fill({}));

        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText('5')).toBeInTheDocument();
        });
    });

    it('displays "9+" when count exceeds 9', async () => {
        // Mock 12 items
        vi.mocked(challengeService.getPendingChallenges).mockResolvedValue(new Array(12).fill({}));

        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText('9+')).toBeInTheDocument();
        });
    });

    it('applies ACTIVE styling when on /challenges route', async () => {
        vi.mocked(challengeService.getPendingChallenges).mockResolvedValue([]);

        // Simulate being on the challenges page
        renderWithRouter('/challenges');

        const link = screen.getByRole('link');

        // Active style class (from your default props)
        expect(link).toHaveClass('bg-orange-500');
        expect(link).toHaveClass('text-white');
    });

    it('applies INACTIVE styling when on Home route', async () => {
        vi.mocked(challengeService.getPendingChallenges).mockResolvedValue([]);

        // Simulate being on Home page
        renderWithRouter('/');

        const link = screen.getByRole('link');

        // Should NOT have active background, but should have hover classes
        expect(link).not.toHaveClass('bg-orange-500');
        expect(link).toHaveClass('hover:bg-orange-500');
    });
});