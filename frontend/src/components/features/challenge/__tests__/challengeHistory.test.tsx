import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HistoryChallenges } from '../challengeHistory';
import type { Challenge } from '@/types/challenge';

// Mock child component
vi.mock('../challengeItem', () => ({
  ChallengeItem: ({ challenge }: { challenge: Challenge }) => (
    <div data-testid="history-item">History {challenge.id}</div>
  )
}));

describe('ChallengeHistory Component', () => {
  it('renders empty state when no history', () => {
    render(<HistoryChallenges completed={[]} />);
    
    expect(screen.getByText(/No Completed Challenges/i)).toBeInTheDocument();
    expect(screen.getByText(/Finish a challenge to see it here/i)).toBeInTheDocument();
  });

  it('renders list of completed challenges', () => {
    const mockHistory: Challenge[] = [
      { id: 301, status: 'COMPLETED' } as any,
      { id: 302, status: 'COMPLETED' } as any,
    ];

    render(<HistoryChallenges completed={mockHistory} />);

    expect(screen.queryByText(/No Completed Challenges/i)).not.toBeInTheDocument();
    
    const items = screen.getAllByTestId('history-item');
    expect(items).toHaveLength(2);
    expect(screen.getByText('History 301')).toBeInTheDocument();
    expect(screen.getByText('History 302')).toBeInTheDocument();
  });
});