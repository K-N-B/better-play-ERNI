import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GameIntro from '../gameIntro';

// Mock the Difficulty Toggle since we just want to know if it was rendered/passed props
vi.mock('../../ui/difficultyToggle', () => ({
    default: ({ onToggle, disabled }: any) => (
        <button
            data-testid="difficulty-toggle"
            onClick={() => !disabled && onToggle(true)} // Simulate switching to Hard
            disabled={disabled}
        >
            Toggle
        </button>
    )
}));

describe('GameIntro Component', () => {
    const mockOnStart = vi.fn();
    const mockOnDifficultyChange = vi.fn();

    const defaultProps = {
        title: 'Test Game',
        description: '<p>Intro Text</p>',
        howToPlay: 'Just click stuff',
        pointsInfo: '100 pts',
        pointsCalculation: 'Math',
        hintInfo: 'Hints cost money',
        onStart: mockOnStart,
        onDifficultyChange: mockOnDifficultyChange,
        initialDifficulty: 'easy' as const
    };

    it('renders title and instructions', () => {
        render(<GameIntro {...defaultProps} />);

        expect(screen.getByText('Test Game')).toBeInTheDocument();
        expect(screen.getByText('Just click stuff')).toBeInTheDocument();
        expect(screen.getByText('100 pts')).toBeInTheDocument();
    });

    it('calls onStart when Start button is clicked', () => {
        render(<GameIntro {...defaultProps} />);

        fireEvent.click(screen.getByText('Start'));
        expect(mockOnStart).toHaveBeenCalled();
    });

    it('allows changing difficulty in normal mode', () => {
        render(<GameIntro {...defaultProps} />);

        // Click the mocked toggle
        fireEvent.click(screen.getByTestId('difficulty-toggle'));

        // Expect callback with "hard" (since our mock sends true)
        expect(mockOnDifficultyChange).toHaveBeenCalledWith('hard');
    });

    it('locks difficulty in Challenge Mode', () => {
        render(
            <GameIntro
                {...defaultProps}
                disableDifficultyChange={true}
                initialDifficulty="hard"
            />
        );

        // Should verify that the toggle is NOT present or replaced by the banner
        expect(screen.queryByTestId('difficulty-toggle')).not.toBeInTheDocument();

        // Should see the Challenge Banner
        expect(screen.getByText(/Challenge Mode/i)).toBeInTheDocument();
        expect(screen.getByText(/Playing on/)).toBeInTheDocument();
        expect(screen.getByText('hard')).toBeInTheDocument();
    });
});