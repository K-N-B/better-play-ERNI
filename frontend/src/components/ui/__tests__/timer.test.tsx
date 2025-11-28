import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Timer } from '../timer';

describe('Timer Component', () => {
    it('formats 0 milliseconds as 00:00', () => {
        render(<Timer timeMs={0} />);
        expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('formats milliseconds into MM:SS correctly', () => {
        // 65 seconds = 1 minute 5 seconds -> 01:05
        render(<Timer timeMs={65000} />);
        expect(screen.getByText('01:05')).toBeInTheDocument();
    });

    it('formats large times correctly (e.g., 10 mins)', () => {
        // 600 seconds = 10 minutes -> 10:00
        render(<Timer timeMs={600000} />);
        expect(screen.getByText('10:00')).toBeInTheDocument();
    });
});