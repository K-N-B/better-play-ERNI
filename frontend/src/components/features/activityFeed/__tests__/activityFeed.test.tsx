import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivityFeed } from '../activityFeed';
// ✅ FIX: Use alias '@' to ensure correct path resolution
import * as activityService from '@/api/activityService'; 

// ✅ FIX: Mock the alias path exactly
vi.mock('@/api/activityService', () => ({
  getActivityHub: vi.fn()
}));

// Mock the child component
vi.mock('../activityFeedItem', () => ({
  ActivityFeedItem: ({ event }: any) => <div data-testid="feed-item">{event.id}</div>
}));

describe('ActivityFeed Container', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    // Return a promise that never resolves immediately to check loading state
    vi.mocked(activityService.getActivityHub).mockReturnValue(new Promise(() => {}));
    
    render(<ActivityFeed />);
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders a list of activities after fetch', async () => {
    const mockData = {
      recent_activity: [
        { id: '1', event_type: 'submission' },
        { id: '2', event_type: 'challenge_sent' }
      ],
      online_users: []
    };

    // ✅ FIX: Use mockResolvedValue for async responses
    vi.mocked(activityService.getActivityHub).mockResolvedValue(mockData as any);

    render(<ActivityFeed />);

    await waitFor(() => {
      const items = screen.getAllByTestId('feed-item');
      expect(items).toHaveLength(2);
    });
  });

  it('renders empty state message when no activities', async () => {
    const mockData = {
      recent_activity: [],
      online_users: []
    };

    vi.mocked(activityService.getActivityHub).mockResolvedValue(mockData as any);

    render(<ActivityFeed />);

    await waitFor(() => {
      expect(screen.getByText(/No recent activity/i)).toBeInTheDocument();
    });
  });
});