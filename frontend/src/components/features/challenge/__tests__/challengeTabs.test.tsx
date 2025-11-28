import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChallengeTabs } from '../challengeTabs';

describe('ChallengeTabs Component', () => {
    const mockSetActiveTab = vi.fn();

    it('renders tabs with correct counts', () => {
        render(
            <ChallengeTabs
                activeTab="pending"
                setActiveTab={mockSetActiveTab}
                activePendingCount={5}
                totalCompleted={10}
            />
        );

        // Check Pending Tab
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument(); // Badge

        // Check History Tab
        expect(screen.getByText('History')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument(); // Badge
    });

    it('hides badges when count is 0', () => {
        render(
            <ChallengeTabs
                activeTab="pending"
                setActiveTab={mockSetActiveTab}
                activePendingCount={0}
                totalCompleted={0}
            />
        );

        // Should see text labels but NO badges
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('handles clicking tabs', () => {
        render(
            <ChallengeTabs
                activeTab="pending"
                setActiveTab={mockSetActiveTab}
                activePendingCount={0}
                totalCompleted={0}
            />
        );

        // Click History
        fireEvent.click(screen.getByText('History'));
        expect(mockSetActiveTab).toHaveBeenCalledWith('history');
    });

    it('applies active styling correctly', () => {
        render(
            <ChallengeTabs
                activeTab="history"
                setActiveTab={mockSetActiveTab}
                activePendingCount={0}
                totalCompleted={0}
            />
        );

        // History should be active (amber text/border)
        const historyBtn = screen.getByText('History').closest('button');
        expect(historyBtn).toHaveClass('text-amber-600');

        // Pending should be inactive (gray text)
        const pendingBtn = screen.getByText('Pending').closest('button');
        expect(pendingBtn).toHaveClass('text-gray-600');
    });
});