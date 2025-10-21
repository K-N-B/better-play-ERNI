const API_BASE = 'http://localhost:8000/api';

export const puzzleApi = {
  // Get today's puzzle
  getDailyPuzzle: async (gameType: string, difficulty: string = 'easy') => {
    const res = await fetch(`${API_BASE}/puzzles/daily/${gameType}/?difficulty=${difficulty}`, {
      credentials: 'include'
    });
    return res.json();
  },

  // Start puzzle attempt
  startPuzzle: async (puzzleId: number) => {
    const res = await fetch(`${API_BASE}/puzzles/${puzzleId}/start/`, {
      method: 'POST',
      credentials: 'include'
    });
    return res.json();
  },

  // Submit guess
  submitGuess: async (attemptId: number, guess: string) => {
    const res = await fetch(`${API_BASE}/puzzles/attempts/${attemptId}/guess/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guess })
    });
    return res.json();
  },

  // Request hint
  requestHint: async (attemptId: number) => {
    const res = await fetch(`${API_BASE}/puzzles/attempts/${attemptId}/hint/`, {
      method: 'POST',
      credentials: 'include'
    });
    return res.json();
  },

  // Get leaderboard
  getLeaderboard: async (period: string) => {
    const res = await fetch(`${API_BASE}/leaderboards/${period}/`, {
      credentials: 'include'
    });
    return res.json();
  },

  // Get top 3 for podium
  getTop3: async (period: string) => {
    const res = await fetch(`${API_BASE}/leaderboards/${period}/top3/`, {
      credentials: 'include'
    });
    return res.json();
  },

  // Get user dashboard
  getDashboard: async () => {
    const res = await fetch(`${API_BASE}/user/dashboard/`, {
      credentials: 'include'
    });
    return res.json();
  }
};