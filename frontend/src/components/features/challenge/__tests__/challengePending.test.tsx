import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PendingChallenges } from '../challengePending';
import type { Challenge } from '@/types/challenge';
import type { UserProfile } from '@/types/user';

// Mock the child component to simplify testing the list logic
vi.mock('../challengeItem', () => ({
  ChallengeItem: ({ challenge }: { challenge: Challenge }) => (
    <div data-testid="challenge-item">Item {challenge.id}</div>
  )
}));

describe('ChallengePending Component', () => {
  const mockUser = { id: 1, username: 'Alice' } as UserProfile;
  const otherUser = { id: 2, username: 'Bob' } as UserProfile;

  const mockActive: Challenge[] = [
    { id: 101, recipient: mockUser, challenger: otherUser } as any, // Incoming (To Alice)
    { id: 102, recipient: otherUser, challenger: mockUser } as any, // Outgoing (From Alice)
  ];

  const mockExpired: Challenge[] = [
    { id: 201, status: 'EXPIRED' } as any
  ];

  const mockRefresh = vi.fn();

  it('renders empty state when no data provided', () => {
    render(
      <PendingChallenges 
        user={mockUser} 
        activePending={[]} 
        expiredPending={[]} 
        refreshChallenges={mockRefresh} 
      />
    );

    expect(screen.getByText(/No Pending Challenges/i)).toBeInTheDocument();
    expect(screen.queryByTestId('challenge-item')).not.toBeInTheDocument();
  });

  it('renders "Challenges for You" and "Challenges You Sent" correctly', () => {
    render(
      <PendingChallenges 
        user={mockUser} 
        activePending={mockActive} 
        expiredPending={[]} 
        refreshChallenges={mockRefresh} 
      />
    );

    // Check Section Headers
    expect(screen.getByText(/Challenges for You/i)).toBeInTheDocument();
    expect(screen.getByText(/Challenges You Sent/i)).toBeInTheDocument();

    // Should render 2 active items
    const items = screen.getAllByTestId('challenge-item');
    expect(items).toHaveLength(2);
    expect(screen.getByText('Item 101')).toBeInTheDocument();
    expect(screen.getByText('Item 102')).toBeInTheDocument();
  });

  it('renders "Expired Challenges" section', () => {
    render(
      <PendingChallenges 
        user={mockUser} 
        activePending={[]} 
        expiredPending={mockExpired} 
        refreshChallenges={mockRefresh} 
      />
    );

    expect(screen.getByText(/Expired Challenges/i)).toBeInTheDocument();
    expect(screen.getByText('Item 201')).toBeInTheDocument();
  });
});