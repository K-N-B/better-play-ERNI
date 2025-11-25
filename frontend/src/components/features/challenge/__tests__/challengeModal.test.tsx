import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChallengeModal } from '../challengeModal';
import * as challengeService from '@/api/challengeService';
import * as gameService from '@/api/gameService';
import type { Challenge } from '@/types/challenge';

// --- Mocks ---
vi.mock('@/api/challengeService', () => ({
  listAllUsers: vi.fn(),
  sendChallenge: vi.fn()
}));

vi.mock('@/api/gameService', () => ({
  checkUserSubmissionExists: vi.fn()
}));

// Mock Data
const mockUsers = [
  { id: 101, username: 'Alice', email: 'alice@erni.com' },
  { id: 102, username: 'Bob', email: 'bob@erni.com' },
  { id: 103, username: 'Charlie', email: 'charlie@erni.com' }
];

const mockChallengeResponse: Challenge = {
  id: 999,
  challenger: { id: 1, username: 'Me' },
  recipient: { id: 101, username: 'Alice' },
  puzzle_type: 'wordle',
  puzzle_id: 55,
  challenger_submission: { 
    id: 123, 
    points_awarded: 100, 
    difficulty: 'hard', 
    time_taken_ms: 60000, 
    tries: 4 
  },
  recipient_submission: null,
  status: 'PENDING',
  winner: null,
  created_at: new Date().toISOString(),
};

describe('ChallengeModal Component', () => {
  const mockOnClose = vi.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    submissionId: 123,
    puzzleType: 'wordle',
    puzzleId: 55,
    dailyPuzzleDate: '2025-10-30'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 1. Mock User List
    vi.mocked(challengeService.listAllUsers).mockResolvedValue(mockUsers as any);
    
    // 2. Mock Status Check (Default: Nobody has played yet)
    // ✅ FIX: Include 'userId' to satisfy TypeScript interface
    vi.mocked(gameService.checkUserSubmissionExists).mockResolvedValue({ 
      hasSubmitted: false, 
      userId: 0 
    } as any);
    
    // 3. Mock Send Challenge
    vi.mocked(challengeService.sendChallenge).mockResolvedValue(mockChallengeResponse);
  });

  it('does not render when isOpen is false', () => {
    render(<ChallengeModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Challenge a Colleague')).not.toBeInTheDocument();
  });

  it('renders and fetches users on mount', async () => {
    render(<ChallengeModal {...defaultProps} />);

    expect(screen.getByText('Challenge a Colleague')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    expect(challengeService.listAllUsers).toHaveBeenCalled();
    expect(gameService.checkUserSubmissionExists).toHaveBeenCalledTimes(3);
  });

  it('filters users when typing in search', async () => {
    render(<ChallengeModal {...defaultProps} />);
    await waitFor(() => screen.getByText('Alice'));

    const searchInput = screen.getByPlaceholderText(/Search by name/i);
    fireEvent.change(searchInput, { target: { value: 'Bob' } });

    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('disables users who have already completed the puzzle', async () => {
    // ✅ FIX: Mock implementation now returns 'userId' to satisfy TS
    vi.mocked(gameService.checkUserSubmissionExists).mockImplementation(async (id) => {
      return { 
        hasSubmitted: id === 102, 
        userId: id 
      }; 
    });

    render(<ChallengeModal {...defaultProps} />);
    await waitFor(() => screen.getByText('Bob'));

    // Check that at least one "Completed" badge exists
    expect(screen.getAllByText('Completed').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText('Bob'));
    expect(screen.queryByText('Challenging: Bob')).not.toBeInTheDocument();
  });

  it('allows selecting a user and sending a challenge', async () => {
    render(<ChallengeModal {...defaultProps} />);
    await waitFor(() => screen.getByText('Alice'));

    fireEvent.click(screen.getByText('Alice'));

    expect(screen.getByText('Challenging: Alice')).toBeInTheDocument();
    const sendBtn = screen.getByRole('button', { name: /Send/i });
    expect(sendBtn).toBeInTheDocument();

    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(challengeService.sendChallenge).toHaveBeenCalledWith({
        recipient_id: 101,
        submission_id: 123
      });
      expect(screen.getByText(/Challenge sent to Alice!/i)).toBeInTheDocument();
    });
  });

  it('displays error message if sending fails', async () => {
    vi.mocked(challengeService.sendChallenge).mockRejectedValue(new Error('Network Error'));

    render(<ChallengeModal {...defaultProps} />);
    await waitFor(() => screen.getByText('Alice'));

    fireEvent.click(screen.getByText('Alice'));
    fireEvent.click(screen.getByRole('button', { name: /Send/i }));

    await waitFor(() => {
      expect(screen.getByText(/Network Error/i)).toBeInTheDocument();
    });
  });
});