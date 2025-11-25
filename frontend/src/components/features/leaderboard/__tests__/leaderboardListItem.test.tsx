import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LeaderboardListItem } from '../leaderboardListItem';
import type { IndividualScoreEntry, DepartmentScoreEntry } from '../../../../types/leaderboard';

describe('LeaderboardListItem Component', () => {

    const mockIndividual: IndividualScoreEntry = {
        user: { id: 1, username: 'TestUser', profile_picture_url: 'http://img.com/pic.jpg' },
        score: 500
    };

    const mockDepartment: DepartmentScoreEntry = {
        department: { id: 2, name: 'Engineering' },
        score: 1000
    };

    it('renders individual entry correctly (with profile image)', () => {
        render(<LeaderboardListItem entry={mockIndividual} rank={1} type="individual" />);

        // Check Rank (1st place)
        expect(screen.getByText('1')).toBeInTheDocument();
        // Check Name
        expect(screen.getByText('TestUser')).toBeInTheDocument();
        // Check Score
        expect(screen.getByText('500')).toBeInTheDocument();
        // Check Image
        const img = screen.getByAltText('TestUser profile picture');
        expect(img).toHaveAttribute('src', 'http://img.com/pic.jpg');
    });

    it('renders fallback initial when profile image is missing', () => {
        const userNoImg = { ...mockIndividual, user: { ...mockIndividual.user, profile_picture_url: null } };

        render(<LeaderboardListItem entry={userNoImg} rank={2} type="individual" />);

        // Should see initial "T" for TestUser
        expect(screen.getByText('T')).toBeInTheDocument();
        // Should not see img tag
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('renders department entry correctly', () => {
        render(<LeaderboardListItem entry={mockDepartment} rank={4} type="department" />);

        // Check Rank
        expect(screen.getByText('4')).toBeInTheDocument();
        // Check Dept Name
        expect(screen.getByText('Engineering')).toBeInTheDocument();
        // Check Score
        expect(screen.getByText('1000')).toBeInTheDocument();
    });

    it('applies correct rank colors', () => {
        const { container: c1 } = render(<LeaderboardListItem entry={mockIndividual} rank={1} type="individual" />);
        expect(c1.querySelector('.text-yellow-500')).toBeInTheDocument(); // Gold

        const { container: c2 } = render(<LeaderboardListItem entry={mockIndividual} rank={2} type="individual" />);
        expect(c2.querySelector('.text-gray-500')).toBeInTheDocument(); // Silver

        const { container: c3 } = render(<LeaderboardListItem entry={mockIndividual} rank={3} type="individual" />);
        expect(c3.querySelector('.text-amber-700')).toBeInTheDocument(); // Bronze
    });
});