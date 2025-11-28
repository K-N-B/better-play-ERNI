import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChallengeItem } from '../challengeItem';
import type { Challenge } from '@/types/challenge';

// --- Mocks ---

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

vi.mock('@/hooks/authContext', () => ({
  useAuth: () => ({ user: { id: 1, username: 'Alice' } })
}));

vi.mock('@/types/challenge', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    getChallengeExpiryStatus: vi.fn(() => ({ 
      isExpired: false, 
      timeRemaining: '2h remaining', 
      urgency: 'safe' 
    })),
    getUrgencyColorClasses: vi.fn(() => ({ text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }))
  };
});

describe('ChallengeItem Component', () => {
  const mockChallenger = { id: 1, username: 'Alice' };
  const mockRecipient = { id: 2, username: 'Bob' };

  const baseChallenge: Challenge = {
    id: 100,
    challenger: mockChallenger,
    recipient: mockRecipient,
    puzzle_type: 'wordle',
    puzzle_id: 55,
    challenger_submission: { id: 1, points_awarded: 100, difficulty: 'hard', time_taken_ms: 60000, tries: 4 },
    recipient_submission: null,
    status: 'PENDING',
    winner: null,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders as SENDER (Waiting State)', () => {
    render(<ChallengeItem challenge={baseChallenge} />);

    // ✅ FIX: Use getAllByText because "Waiting for" appears in header AND footer
    expect(screen.getAllByText(/Waiting for/).length).toBeGreaterThan(0);
    
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.queryByText('Play Now')).not.toBeInTheDocument();
  });

  it('renders as RECIPIENT (Action State)', () => {
    const challengeForAlice = {
      ...baseChallenge,
      challenger: mockRecipient, // Bob
      recipient: mockChallenger  // Alice
    };

    render(<ChallengeItem challenge={challengeForAlice} />);

    expect(screen.getByText(/Challenge from/)).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();

    const playBtn = screen.getByText('Play Now');
    expect(playBtn).toBeInTheDocument();

    fireEvent.click(playBtn);
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/game/wordle?challenge_id=100&difficulty=hard')
    );
  });

  it('renders COMPLETED state (Win)', () => {
    const completedChallenge: Challenge = {
      ...baseChallenge,
      status: 'COMPLETED',
      recipient_submission: { id: 2, points_awarded: 150, difficulty: 'hard', time_taken_ms: 50000, tries: 3 },
      winner: mockChallenger, 
      completed_at: new Date().toISOString()
    };

    render(<ChallengeItem challenge={completedChallenge} />);
    expect(screen.getByText('You Won!')).toBeInTheDocument();
  });

  it('renders EXPIRED state', () => {
    const expiredChallenge: Challenge = {
      ...baseChallenge,
      status: 'EXPIRED',
      expires_at: new Date(Date.now() - 10000).toISOString()
    };

    render(<ChallengeItem challenge={expiredChallenge} />);

    // ✅ FIX: Use getAllByText here too as "EXPIRED" might appear in badge and text
    expect(screen.getAllByText(/EXPIRED/i).length).toBeGreaterThan(0);
    expect(screen.queryByText('Play Now')).not.toBeInTheDocument();
  });
});