import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GamesStrip } from '../gamesStrip';
import { MemoryRouter } from 'react-router-dom';

// ✅ FIX: Define the Mock Icon INSIDE the factory to avoid ReferenceError
vi.mock('@/data/gameCardData', () => {
  const MockIcon = () => <svg data-testid="mock-icon" />;

  return {
    gameCardData: [
      { 
        title: 'Mock Game A', 
        path: '/mock-a', 
        bgColor: 'bg-red-500', 
        shadowColor: 'shadow-red-700', 
        IconComponent: MockIcon 
      },
      { 
        title: 'Mock Game B', 
        path: '/mock-b', 
        bgColor: 'bg-blue-500', 
        shadowColor: 'shadow-blue-700', 
        IconComponent: MockIcon 
      },
    ]
  };
});

describe('GamesStrip Component', () => {
  it('renders the mocked games instead of real data', () => {
    render(
      <MemoryRouter>
        <GamesStrip />
      </MemoryRouter>
    );

    expect(screen.getByText('Mock Game A')).toBeInTheDocument();
    expect(screen.getByText('Mock Game B')).toBeInTheDocument();
    
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.getAllByTestId('mock-icon')).toHaveLength(2);
  });
});