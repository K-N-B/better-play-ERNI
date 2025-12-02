import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GameCard } from '../gameCard';
import { MemoryRouter } from 'react-router-dom';
import { Brain } from 'lucide-react';

describe('GameCard Component', () => {
    const defaultProps = {
        title: 'Sudoku',
        subtitle: 'Logic Puzzle',
        bgColor: 'bg-blue-500',
        shadowColor: 'shadow-blue-700',
        IconComponent: Brain,
        path: '/game/sudoku'
    };

    it('renders title and subtitle', () => {
        render(
            <MemoryRouter>
                <GameCard {...defaultProps} />
            </MemoryRouter>
        );

        expect(screen.getByText('Sudoku')).toBeInTheDocument();
        expect(screen.getByText('Logic Puzzle')).toBeInTheDocument();
    });

    it('links to the correct path', () => {
        render(
            <MemoryRouter>
                <GameCard {...defaultProps} />
            </MemoryRouter>
        );

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/game/sudoku');
    });
});