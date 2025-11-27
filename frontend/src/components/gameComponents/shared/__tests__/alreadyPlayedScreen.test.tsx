import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AlreadyPlayedScreen } from '../alreadyPlayedScreen';
import { MemoryRouter } from 'react-router-dom';

// Mock timer hook since it's used inside (if applicable) or just ensure props are passed correctly
// Based on your file, it seems to be a display component.

describe('AlreadyPlayedScreen Component', () => {
    it('renders score and message correctly for Sudoku', () => {
        render(
            <MemoryRouter>
                <AlreadyPlayedScreen
                    gameType="sudoku"
                    score={150}
                    submittedAt="2023-01-01T12:00:00Z"
                    difficulty="hard"
                />
            </MemoryRouter>
        );

        expect(screen.getByText(/Already Completed!/i)).toBeInTheDocument();
        expect(screen.getByText(/You've already completed/i)).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument(); // Score
        expect(screen.getByText(/hard/i)).toBeInTheDocument(); // Difficulty
    });

    it('renders correct title for Wordle', () => {
        render(
            <MemoryRouter>
                <AlreadyPlayedScreen
                    gameType="wordle"
                    score={0}
                    submittedAt="2023-01-01"
                    difficulty="easy"
                />
            </MemoryRouter>
        );

        // Check for capitalization/formatting if your component does that
        expect(screen.getByText(/wordle/i)).toBeInTheDocument();
    });
});