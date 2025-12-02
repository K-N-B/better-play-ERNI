import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActivityFeedItem } from '../activityFeedItem';
import type { ActivityEvent } from '../../../../types/activity';

// Mock the time format util to return a static string
vi.mock('../../../utils/timeFormat', () => ({
    formatTimeAgo: () => '10m ago'
}));

describe('ActivityFeedItem Component', () => {
    const mockUser = { id: 1, username: 'Alice', profile_picture_url: null };
    const mockUser2 = { id: 2, username: 'Bob', profile_picture_url: null };

    it('renders a standard SUBMISSION event (Sudoku)', () => {
        const event: ActivityEvent = {
            id: 'sub_1',
            event_type: 'submission',
            created_at: '2023-01-01',
            user: mockUser,
            puzzle_name: 'Sudoku',
            difficulty: 'hard',
            time_in_minutes: '5:00',
            challenger: mockUser, // Not used for submission
            recipient: mockUser,  // Not used for submission
            status: 'COMPLETED'
        };

        render(<ActivityFeedItem event={event} />);

        // Check text content
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Sudoku')).toBeInTheDocument();
        expect(screen.getByText('hard')).toBeInTheDocument();
        expect(screen.getByText(/5:00 minutes/)).toBeInTheDocument();

        // Check styling (Sudoku should be Pink)
        const puzzleName = screen.getByText('Sudoku');
        expect(puzzleName).toHaveClass('text-pink-600');
    });

    it('renders a CHALLENGE SENT event', () => {
        const event: ActivityEvent = {
            id: 'chal_sent_1',
            event_type: 'challenge_sent',
            created_at: '2023-01-01',
            challenger: mockUser,
            recipient: mockUser2,
            puzzle_name: 'Wordle',
            difficulty: 'easy',
            status: 'PENDING'
        };

        render(<ActivityFeedItem event={event} />);

        // "Alice challenged Bob"
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText('Wordle')).toBeInTheDocument();

        // Challenge styling (Orange)
        const puzzleName = screen.getByText('Wordle');
        expect(puzzleName).toHaveClass('text-orange-600');
    });

    it('renders a CHALLENGE COMPLETED event (Win condition)', () => {
        const event: ActivityEvent = {
            id: 'chal_comp_1',
            event_type: 'challenge_completed',
            created_at: '2023-01-01',
            challenger: mockUser, // Alice sent it
            recipient: mockUser2, // Bob played it
            winner: mockUser2,    // Bob won
            puzzle_name: 'ERNIgram',
            status: 'COMPLETED'
        };

        render(<ActivityFeedItem event={event} />);

        // Bob completed Alice's challenge
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText(/Alice/)).toBeInTheDocument();

        // Verify result text
        expect(screen.getByText('WON against')).toBeInTheDocument();
    });

    it('renders a CHALLENGE COMPLETED event (Loss condition)', () => {
        const event: ActivityEvent = {
            id: 'chal_comp_2',
            event_type: 'challenge_completed',
            created_at: '2023-01-01',
            challenger: mockUser,
            recipient: mockUser2,
            winner: mockUser, // Alice (challenger) won, so Bob lost
            puzzle_name: 'ERNIgram',
            status: 'COMPLETED'
        };

        render(<ActivityFeedItem event={event} />);

        expect(screen.getByText('LOST to')).toBeInTheDocument();
    });
});