import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WordleGame } from '../wordleGame';
import type { Difficulty } from '../../../../pages/gamePage';

// --- 1. Define Stable Mocks (Critical for useEffect dependencies) ---
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
    refreshUser: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock('../../../../context/ChallengeContext', () => ({
  // Return the SAME function instance every time
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
      BASE_POINTS: { HARD: 100 }, 
      TIME_LIMITS_MS: { HARD: 60000 } 
    },
    loading: false
  })
}));

vi.mock('../../../../hooks/useSound', () => ({
  useSound: () => mockPlaySound, 
}));

vi.mock('../../../../api/gameService', () => ({
  submitPuzzle: vi.fn(),
  getSavedAttempt: vi.fn().mockResolvedValue(null),
  saveProgress: vi.fn().mockResolvedValue({}),
  checkSubmissionExists: vi.fn().mockResolvedValue({ hasSubmitted: false }),
  getGameLimits: vi.fn(),
}));

vi.mock('../../../../services/wordValidator', () => ({
  isValidWord: vi.fn((word) => Promise.resolve(word === 'APPLE' || word === 'VALID')),
}));

// Use the REAL keyboard logic (no mock), but we keep Grid mocked for simplicity
vi.mock('../wordleGrid', () => ({
  WordleGrid: ({ currentGuess, guesses }: any) => (
    <div data-testid="game-grid">
      <div data-testid="guesses">{JSON.stringify(guesses)}</div>
      <div data-testid="current-guess">{currentGuess}</div>
    </div>
  )
}));

// --- 3. The Tests ---

describe('WordleGame Component', () => {
  const mockPuzzle = {
    id: 1,
    date_to_be_used: '2025-10-30',
    solution_word: 'APPLE',
  } as any;

  const mockDifficulty: Difficulty = 'hard';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the game title and starts the timer', async () => {
    render(<WordleGame puzzle={mockPuzzle} difficulty={mockDifficulty} challengeId={null} />);

    // Wait for loading to finish
    expect(await screen.findByText(/Wordle/i)).toBeInTheDocument();
    expect(screen.getByText(/on Hard difficulty/i)).toBeInTheDocument();
  });

  it('updates current guess when virtual keyboard is clicked', async () => {
    render(<WordleGame puzzle={mockPuzzle} difficulty={mockDifficulty} challengeId={null} />);
    await screen.findByText(/Wordle/i);

    // Click "A" using the aria-label you added
    const buttonA = screen.getByRole('button', { name: 'A' });
    fireEvent.click(buttonA);

    expect(screen.getByTestId('current-guess')).toHaveTextContent('A');
  });

  it('handles typing a full valid word and submitting', async () => {
    render(<WordleGame puzzle={mockPuzzle} difficulty={mockDifficulty} challengeId={null} />);
    await screen.findByText(/Wordle/i);

    // Type APPLE
    fireEvent.click(screen.getByRole('button', { name: 'A' }));
    fireEvent.click(screen.getByRole('button', { name: 'P' }));
    fireEvent.click(screen.getByRole('button', { name: 'P' }));
    fireEvent.click(screen.getByRole('button', { name: 'L' }));
    fireEvent.click(screen.getByRole('button', { name: 'E' }));

    expect(screen.getByTestId('current-guess')).toHaveTextContent('APPLE');

    // Submit
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Enter' }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('guesses')).toHaveTextContent('APPLE');
      expect(screen.getByTestId('current-guess')).toBeEmptyDOMElement(); 
    });
  });

  it('shows error for invalid words', async () => {
    const { isValidWord } = await import('../../../../services/wordValidator');
    vi.mocked(isValidWord).mockResolvedValueOnce(false); 

    render(<WordleGame puzzle={mockPuzzle} difficulty={mockDifficulty} challengeId={null} />);
    await screen.findByText(/Wordle/i);

    const btnA = screen.getByRole('button', { name: 'A' });
    // Type AAAAA
    fireEvent.click(btnA); fireEvent.click(btnA); fireEvent.click(btnA); fireEvent.click(btnA); fireEvent.click(btnA);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Enter' }));
    });

    expect(await screen.findByText(/not a valid word/i)).toBeInTheDocument();
    expect(screen.getByTestId('guesses')).not.toHaveTextContent('AAAAA');
  });
});