import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WhosOnline } from '../whosOnline';

// Mock the child list component
vi.mock('../whosOnlineList', () => ({
    WhosOnlineList: () => <div data-testid="online-list">Mock List</div>
}));

describe('WhosOnline Component', () => {
    it('renders the header and the list', () => {
        render(<WhosOnline />);

        // Check Header
        expect(screen.getByText("Who's Online")).toBeInTheDocument();

        // Check Child Render
        expect(screen.getByTestId('online-list')).toBeInTheDocument();
    });
});