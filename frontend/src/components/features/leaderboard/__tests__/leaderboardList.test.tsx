import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LeaderboardList } from '../leaderboardList';
import type { IndividualScoreEntry } from '../../../../types/leaderboard';

describe('LeaderboardList Component', () => {
    const mockData: IndividualScoreEntry[] = [
        { user: { id: 1, username: 'Alice', profile_picture_url: null }, score: 300 },
        { user: { id: 2, username: 'Bob', profile_picture_url: null }, score: 200 },
        { user: { id: 3, username: 'Charlie', profile_picture_url: null }, score: 100 },
    ];

    it('renders a message when data is empty', () => {
        render(<LeaderboardList data={[]} type="individual" />);
        expect(screen.getByText(/No further rankings available/i)).toBeInTheDocument();
    });

    it('renders a list of items correctly', () => {
        render(<LeaderboardList data={mockData} type="individual" />);

        // Check if all names appear
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText('Charlie')).toBeInTheDocument();

        // Check if Ranks 1, 2, 3 are assigned automatically
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('handles offsetRank prop correctly', () => {
        // If we are on Page 2 (starting at rank 4)
        render(<LeaderboardList data={mockData} type="individual" offsetRank={4} />);

        // Names should still be there
        expect(screen.getByText('Alice')).toBeInTheDocument();

        // But ranks should now be 4, 5, 6
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('6')).toBeInTheDocument();

        // Rank 1 should NOT be visible
        expect(screen.queryByText('1')).not.toBeInTheDocument();
    });
});