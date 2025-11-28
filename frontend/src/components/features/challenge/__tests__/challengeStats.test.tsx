import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChallengeStats } from '../challengeStats';

describe('ChallengeStats Component', () => {
    it('renders all stat cards with correct values', () => {
        render(<ChallengeStats active={5} expired={2} won={10} total={20} />);

        // Check Labels
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('Expired')).toBeInTheDocument();
        expect(screen.getByText('Won')).toBeInTheDocument();
        expect(screen.getByText('Total')).toBeInTheDocument();

        // Check Values
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('20')).toBeInTheDocument();
    });

    it('renders zero values correctly', () => {
        render(<ChallengeStats active={0} expired={0} won={0} total={0} />);
        // Ensure it displays "0" and not empty space
        const zeros = screen.getAllByText('0');
        expect(zeros.length).toBeGreaterThanOrEqual(4);
    });
});