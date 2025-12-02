import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom'; // 👈 1. Import MemoryRouter
import { ErnigramGame } from '../ernigramGame';
import type { Difficulty } from '../../../../pages/gamePage';

// --- 1. Define Stable Mocks ---
const mockRefreshChallenges = vi.fn();
const mockStartTimer = vi.fn();
const mockStopTimer = vi.fn();
const mockSetSavedTime = vi.fn();
const mockPlaySound = vi.fn();

// --- 2. Mock Dependencies ---
vi.mock('../../../../hooks/authContext', () => ({
  useAuth: () => ({
    user: { 
      id: 1, 
      username: 'TestUser', 
      current_points: 100 
    },
    refreshUser: vi.fn(), // Mock the refresh function
    isLoading: false,
  }),
}));

vi.mock('../../../../context/ChallengeContext', () => ({
  useChallenges: () => ({ refreshChallenges: mockRefreshChallenges })
}));

vi.mock('../../../../hooks/useTimer', () => ({
  useTimer: () => ({
    time: 0,
    startTimer: mockStartTimer,
    stopTimer: mockStopTimer,
    setSavedTime: mockSetSavedTime,
  })
}));

vi.mock('../../../../hooks/useApi', () => ({
  useApi: () => ({
    data: { 
      BASE_POINTS: { EASY: 100, HARD: 200 }, 
      TIME_LIMITS_MS: { EASY: 60000, HARD: 60000 },
      MISTAKE_LIMITS: { EASY: 5, HARD: 3 }
    },
    loading: false
  })
}));

vi.mock('../../../../hooks/useSound', () => ({
  useSound: () => mockPlaySound, 
}));

// Mock Services (API Calls)
vi.mock('../../../../api/gameService', () => ({
  submitPuzzle: vi.fn().mockResolvedValue({ 
    score: 150, 
    submissionId: 1, 
    message: "Great job!" 
  }),
  getSavedAttempt: vi.fn().mockResolvedValue(null),
  saveProgress: vi.fn().mockResolvedValue({}),
  checkSubmissionExists: vi.fn().mockResolvedValue({ hasSubmitted: false }),
  getGameLimits: vi.fn(),
}));

vi.mock('../../../../api/challengeService', () => ({
  completeChallenge: vi.fn()
}));

// --- 3. The Tests ---

describe('ErnigramGame Component', () => {
  const mockPuzzle = {
    id: 101,
    date_to_be_used: '2025-10-30',
    solution_phrase: 'HELLO WORLD',
    clue: 'A famous greeting',
    employee_image_url: 'None', 
  } as any;

  const mockDifficulty: Difficulty = 'easy';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the game title, clue, and underscores', async () => {
    render(
      // 👈 2. Wrap every render in MemoryRouter
      <MemoryRouter>
        <ErnigramGame 
          puzzle={mockPuzzle} 
          difficulty={mockDifficulty} 
          challengeId={null} 
          dailyPuzzleDate="2025-10-30"
        />
      </MemoryRouter>
    );

    expect(await screen.findByText(/ERNIgram/i)).toBeInTheDocument();
    expect(screen.getByText('A famous greeting')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('updates display when correct letter is clicked', async () => {
    render(
      <MemoryRouter>
        <ErnigramGame 
          puzzle={mockPuzzle} 
          difficulty={mockDifficulty} 
          challengeId={null} 
          dailyPuzzleDate="2025-10-30"
        />
      </MemoryRouter>
    );
    await screen.findByText(/ERNIgram/i);

    const btnH = screen.getByRole('button', { name: 'H' });
    fireEvent.click(btnH);

    expect(await screen.findByText('H')).toBeInTheDocument();
    expect(mockPlaySound).toHaveBeenCalled();
  });

  it('decreases attempts when wrong letter is clicked', async () => {
    render(
      <MemoryRouter>
        <ErnigramGame 
          puzzle={mockPuzzle} 
          difficulty={mockDifficulty} 
          challengeId={null} 
          dailyPuzzleDate="2025-10-30"
        />
      </MemoryRouter>
    );
    await screen.findByText(/ERNIgram/i);

    const btnZ = screen.getByRole('button', { name: 'Z' });
    fireEvent.click(btnZ);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(mockPlaySound).toHaveBeenCalled();
  });

  it('handles game win condition', async () => {
    const { submitPuzzle } = await import('../../../../api/gameService');
    
    render(
      <MemoryRouter>
        <ErnigramGame 
          puzzle={{ ...mockPuzzle, solution_phrase: 'HI' }} 
          difficulty={mockDifficulty} 
          challengeId={null} 
          dailyPuzzleDate="2025-10-30"
        />
      </MemoryRouter>
    );
    await screen.findByText(/ERNIgram/i);

    // Trigger a win logic
    fireEvent.click(screen.getByRole('button', { name: 'H' }));
    fireEvent.click(screen.getByRole('button', { name: 'I' }));

    // When the game finishes, the Results Modal renders.
    // The Modal calls `useNavigate()`, which now works because of <MemoryRouter>.
    await waitFor(() => {
      expect(submitPuzzle).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'SOLVED' }),
        expect.any(String),
        expect.any(Number)
      );
    });
  });
});