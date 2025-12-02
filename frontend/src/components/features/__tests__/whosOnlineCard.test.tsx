import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WhosOnlineCard } from '../whosOnlineCard';

// Mock the inner content
vi.mock('../whosOnline', () => ({
    WhosOnline: () => <div>Inner Content</div>
}));

describe('WhosOnlineCard Component', () => {
    it('renders the card container and content', () => {
        render(<WhosOnlineCard />);
        expect(screen.getByText('Inner Content')).toBeInTheDocument();
    });
});