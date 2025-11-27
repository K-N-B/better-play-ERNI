import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SudokuGame } from '../sudokuGame';
import type { Difficulty } from '../../../../pages/gamePage';

// --- Mocks (Keep existing mocks) ---
const mockRefreshChallenges = vi.fn();
const mockStartTimer = vi.fn();
const mockStopTimer = vi.fn();
const mockSetSavedTime = vi.fn();
const mockPlaySound = vi.fn();

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
        data: { BASE_POINTS: { HARD: 150 }, TIME_LIMITS_MS: { HARD: 600000 } },
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

describe('SudokuGame Component', () => {
    const mockPuzzle = {
        id: 1,
        date_to_be_used: '2025-10-30',
        puzzle_string_easy: '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
        puzzle_string_hard: '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
        solution_string: '534678912672195348198342567859761423426853791713924856961537284287419635345286179'
    } as any;

    const mockDifficulty: Difficulty = 'hard';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('validates input: duplicate numbers in row show error', async () => {
        render(<SudokuGame puzzle={mockPuzzle} difficulty={mockDifficulty} challengeId={null} />);
        await screen.findByText(/Sudoku/i);

        const cell = screen.getByTestId('cell-0-2');
        fireEvent.click(cell);

        fireEvent.keyDown(document, { key: '5' });

        // Wait for error class to appear
        await waitFor(() => {
            expect(cell).toHaveClass('bg-red-200');
        });
    });

    it('validates input: valid number shows normal style', async () => {
        render(<SudokuGame puzzle={mockPuzzle} difficulty={mockDifficulty} challengeId={null} />);
        await screen.findByText(/Sudoku/i);

        const cell = screen.getByTestId('cell-0-2');
        fireEvent.click(cell);

        fireEvent.keyDown(document, { key: '4' });

        await waitFor(() => {
            expect(cell).not.toHaveClass('bg-red-200');
            expect(cell).toHaveTextContent('4');
        });
    });

    it('supports erase via keyboard', async () => {
        render(<SudokuGame puzzle={mockPuzzle} difficulty={mockDifficulty} challengeId={null} />);
        await screen.findByText(/Sudoku/i);

        const cell = screen.getByTestId('cell-0-2');
        fireEvent.click(cell);

        // 1. Type '4'
        fireEvent.keyDown(document, { key: '4' });

        // Wait for the BIG number 4 to appear
        // We look for the class that only the main value has (text-lg) to distinguish from notes
        await waitFor(() => {
            const mainValue = cell.querySelector('.text-lg');
            expect(mainValue).toHaveTextContent('4');
        });

        // 2. Press Backspace
        fireEvent.keyDown(document, { key: 'Backspace' });

        // 3. Verify the BIG number is gone
        await waitFor(() => {
            const mainValue = cell.querySelector('.text-lg');
            expect(mainValue).toBeNull(); // The big number span should be removed from DOM
        });
    });
});