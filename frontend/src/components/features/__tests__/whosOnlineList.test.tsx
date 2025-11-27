import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhosOnlineList } from '../whosOnlineList';
import * as activityService from '@/api/activityService';

// --- Mocks ---
vi.mock('@/api/activityService', () => ({
    getActivityHub: vi.fn(),
    sendHeartbeat: vi.fn()
}));

describe('WhosOnlineList Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Use fake timers to control the intervals if needed, 
        // but for simple render tests, we just let the effects run.
    });

    it('renders loading state initially', () => {
        // Mock a never-resolving promise to hold the loading state
        vi.mocked(activityService.getActivityHub).mockReturnValue(new Promise(() => { }));

        render(<WhosOnlineList />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders a list of online users', async () => {
        const mockUsers = [
            { id: 1, username: 'Alice', profile_picture_url: null },
            { id: 2, username: 'Bob', profile_picture_url: null }
        ];

        vi.mocked(activityService.getActivityHub).mockResolvedValue({
            online_users: mockUsers,
            recent_activity: []
        } as any);

        render(<WhosOnlineList />);

        await waitFor(() => {
            expect(screen.getByText('Alice')).toBeInTheDocument();
            expect(screen.getByText('Bob')).toBeInTheDocument();
        });

        // Verify heartbeat was sent
        expect(activityService.sendHeartbeat).toHaveBeenCalled();
    });

    it('renders empty state when no one is online', async () => {
        vi.mocked(activityService.getActivityHub).mockResolvedValue({
            online_users: [],
            recent_activity: []
        } as any);

        render(<WhosOnlineList />);

        await waitFor(() => {
            expect(screen.getByText(/No one else/i)).toBeInTheDocument();
        });
    });

    it('handles API errors gracefully', async () => {
        // Mock an error
        vi.mocked(activityService.getActivityHub).mockRejectedValue(new Error('Network Error'));

        // Spy on console.error to suppress the noisy output in test logs
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        render(<WhosOnlineList />);

        // It should stop loading. Since your component doesn't render an error message UI 
        // but logs it, we check if loading disappears or if the empty state appears (fallback).
        // Based on your code: catch -> setLoading(false) -> renders empty list (since onlineUsers is [])

        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});