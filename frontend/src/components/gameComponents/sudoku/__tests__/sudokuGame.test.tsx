// src/components/gameComponents/sudoku/__tests__/SudokuGame.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SudokuGame } from '../sudokuGame';
import type { Difficulty } from '../../../../pages/gamePage';

// --- 1. Define Stable Mocks ---
const mockRefreshChallenges = vi.fn();
const mockStartTimer = vi.fn();
const mockStopTimer = vi.fn();
const mockSetSavedTime = vi.fn();
const mockPlaySound = vi.fn();

// --- 2. Mock Dependencies ---
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
            BASE_POINTS: { HARD: 150 },
            TIME_LIMITS_MS: { HARD: 600000 }
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
    getSudokuHintLimits: vi.fn().mockResolvedValue({ HINT_LIMITS: { HARD: 3 } }),
    getHint: vi.fn(),
}));

// --- 3. The Tests ---
describe('SudokuGame Component', () => {
    const mockPuzzle = {
        id: 1,
        date_to_be_used: '2025-10-30',
        // A simple valid 9x9 sudoku string. We know '0' means empty.
        // Row 0 starts with "53007..." -> Cell 0-2 is '0' (Empty)
        puzzle_string_easy: '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
        puzzle_string_hard: '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
        solution_string: '534678912672195348198342567859761423426853791713924856961537284287419635345286179'
    } as any;

    const mockDifficulty: Difficulty = 'hard';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the game title and grid', async () => {
        render(<SudokuGame puzzle={mockPuzzle} difficulty={mockDifficulty} challengeId={null} />);

        // Wait for loading
        expect(await screen.findByText(/Sudoku/i)).toBeInTheDocument();

        // Verify the "Given" number 5 is rendered
        expect(screen.getAllByText('5')[0]).toBeInTheDocument();
    });

    it('allows selecting a cell and entering a number via NumberPad', async () => {
        render(<SudokuGame puzzle={mockPuzzle} difficulty={mockDifficulty} challengeId={null} />);
        await screen.findByText(/Sudoku/i);

        // 1. Find an empty cell (Row 0, Col 2 is '0' in our mock)
        // Now using your new data-testid!
        const emptyCell = screen.getByTestId('cell-0-2');

        // 2. Click the cell
        fireEvent.click(emptyCell);

        // 3. Click "4" on the NumberPad (found by accessible name)
        const btn4 = screen.getByRole('button', { name: '4' });
        fireEvent.click(btn4);

        // 4. Verify the cell updated
        // Note: The cell should now contain the text "4"
        expect(emptyCell).toHaveTextContent('4');
        expect(mockPlaySound).toHaveBeenCalled();
    });

    it('toggles note mode when button is clicked', async () => {
        render(<SudokuGame puzzle={mockPuzzle} difficulty={mockDifficulty} challengeId={null} />);
        await screen.findByText(/Sudoku/i);

        // Find the Toggle Notes button by the aria-label we added
        const noteBtn = screen.getByRole('button', { name: /toggle notes/i });

        // Click it
        fireEvent.click(noteBtn);

        expect(mockPlaySound).toHaveBeenCalled();

        // (Optional) Verify visual change if you export that state, 
        // but checking the click handler fired is usually enough for integration
    });
});