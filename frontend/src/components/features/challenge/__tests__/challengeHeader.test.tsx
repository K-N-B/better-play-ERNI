import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChallengeHeader } from '../challengeHeader';

describe('ChallengeHeader Component', () => {
  it('renders the title and description', () => {
    render(<ChallengeHeader />);
    
    // Check Title
    expect(screen.getByText('Challenges')).toBeInTheDocument();
    
    // Check Description text part
    expect(screen.getByText(/Challenge your colleagues/i)).toBeInTheDocument();
    expect(screen.getByText(/Challenges expire after 24 hours/i)).toBeInTheDocument();
  });
});