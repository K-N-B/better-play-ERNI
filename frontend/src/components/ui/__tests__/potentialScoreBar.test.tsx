import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PotentialScoreBar } from '../potentialScoreBar';

describe('PotentialScoreBar Component', () => {
    const defaultProps = {
        currentScore: 80,
        maxScore: 100,
        basePoints: 50,
        speedBonus: 20,
        bonusOrPenaltyValue: 10,
        bonusOrPenaltyLabel: 'Mistake Bonus',
        color: 'bg-blue-500'
    };

    it('renders the score labels and values correctly', () => {
        render(<PotentialScoreBar {...defaultProps} />);

        // Check header
        expect(screen.getByText(/Potential Score/i)).toBeInTheDocument();
        // Use exact match for the score text
        expect(screen.getByText('80 / 100 pts')).toBeInTheDocument();

        // Check breakdown items
        expect(screen.getByText('Base: 50')).toBeInTheDocument();
        expect(screen.getByText('Speed: +20')).toBeInTheDocument();
    });

    it('renders bonus mode correctly (positive/green/yellow)', () => {
        render(<PotentialScoreBar {...defaultProps} isPenalty={false} />);

        // Expect "+" sign and label for bonus
        expect(screen.getByText('Mistake Bonus: +10')).toBeInTheDocument();
    });

    it('renders penalty mode correctly (negative/red)', () => {
        render(
            <PotentialScoreBar
                {...defaultProps}
                isPenalty={true}
                bonusOrPenaltyLabel="Hint Penalty"
                bonusOrPenaltyValue={20}
            />
        );

        // Expect "-" sign and Red color class
        const penaltyText = screen.getByText('Hint Penalty: -20');
        expect(penaltyText).toBeInTheDocument();
        expect(penaltyText).toHaveClass('text-red-600');
    });

    it('calculates progress bar width percentage correctly', () => {
        const { container } = render(
            <PotentialScoreBar {...defaultProps} currentScore={50} maxScore={100} color="bg-blue-500" />
        );

        // Find the progress bar by its color class
        const progressBar = container.querySelector('.bg-blue-500');

        // 50/100 = 50% width
        expect(progressBar).toHaveStyle({ width: '50%' });
    });
});