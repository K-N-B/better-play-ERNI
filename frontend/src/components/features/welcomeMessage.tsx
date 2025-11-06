// src/components/features/welcomeMessage.tsx - FIXED VERSION WITH LOST GAMES

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/authContext';
import { getTodaySubmissions } from '../../api/gameService';
import type { Submission } from '../../types/game';
import { CheckCircle2, Circle } from 'lucide-react';

const TOTAL_DAILY_PUZZLES = 3;

// Add this type for completed puzzles response
interface CompletedPuzzlesResponse {
  completed: string[];
  date: string;
}

// Add this API call function (or add to gameService.ts)
const getTodayCompletedPuzzles =
  async (): Promise<CompletedPuzzlesResponse> => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const response = await fetch(`${API_URL}/api/gameplay/completed/today/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch completed puzzles');
    }

    return response.json();
  };

export const WelcomeMessage = () => {
  const { user } = useAuth();
  const [submissionsToday, setSubmissionsToday] = useState<Submission[]>([]);
  const [completedGames, setCompletedGames] = useState<string[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (user) {
      setLoadingStats(true);

      // Fetch both submissions (won games) and completed puzzles (won + lost)
      Promise.all([
        getTodaySubmissions().catch(() => []),
        getTodayCompletedPuzzles().catch(() => ({ completed: [], date: '' })),
      ])
        .then(([submissions, completedData]) => {
          console.log('[WelcomeMessage] Submissions received:', submissions);
          console.log(
            '[WelcomeMessage] Completed puzzles received:',
            completedData,
          );

          setSubmissionsToday(submissions);
          setCompletedGames(completedData.completed);
        })
        .catch((err) => {
          console.error("Failed to fetch today's data:", err);
          setSubmissionsToday([]);
          setCompletedGames([]);
        })
        .finally(() => {
          setLoadingStats(false);
        });
    } else {
      setSubmissionsToday([]);
      setCompletedGames([]);
      setLoadingStats(false);
    }
  }, [user]);

  if (!user) return null;

  // Use completedGames length for puzzles completed (includes won + lost)
  const puzzlesCompletedToday = completedGames.length;
  const puzzlesLeftToday = Math.max(
    0,
    TOTAL_DAILY_PUZZLES - puzzlesCompletedToday,
  );

  // Only sum points from actual submissions (won games)
  const dailyScore = submissionsToday.reduce(
    (sum, sub) => sum + sub.points_awarded,
    0,
  );

  console.log('[WelcomeMessage] Completed games:', completedGames);
  console.log('[WelcomeMessage] Puzzles completed:', puzzlesCompletedToday);
  console.log('[WelcomeMessage] Daily score:', dailyScore);

  // Check game status based on completed array from backend
  const gameStatus = {
    wordle: completedGames.includes('wordle'),
    sudoku: completedGames.includes('sudoku'),
    ernigram: completedGames.includes('ernigram'),
  };

  return (
    <div className="p-6 bg-white rounded-4xl text-base shadow border border-gray-200">
      <h1 className="text-lg font-semibold text-primary mb-2">
        Welcome back, {user.username}! 👋
      </h1>

      {loadingStats ? (
        <p className="text-black animate-pulse">Loading today's stats...</p>
      ) : (
        <>
          {puzzlesLeftToday > 0 ? (
            <p className="text-black leading-5">
              You still have{' '}
              <strong className="text-primary">{puzzlesLeftToday}</strong>{' '}
              puzzle
              {puzzlesLeftToday !== 1 ? 's' : ''} left to play today. Maybe
              you're up for a challenge?
            </p>
          ) : (
            <p className="text-black">
              You've completed all puzzles for today! Great job! 🎉
            </p>
          )}

          <p className="text-black mt-1">
            You've earned{' '}
            <strong className="text-primary">{dailyScore} pts</strong> today!
          </p>

          {/* Visual Progress Tracker */}
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Today's Progress:
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {gameStatus.wordle ? (
                  <CheckCircle2 size={20} className="text-emerald-500" />
                ) : (
                  <Circle size={20} className="text-gray-300" />
                )}
                <span
                  className={`text-sm ${gameStatus.wordle ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}
                >
                  Wordle
                </span>
              </div>
              <div className="flex items-center gap-1">
                {gameStatus.sudoku ? (
                  <CheckCircle2 size={20} className="text-pink-500" />
                ) : (
                  <Circle size={20} className="text-gray-300" />
                )}
                <span
                  className={`text-sm ${gameStatus.sudoku ? 'text-pink-600 font-medium' : 'text-gray-400'}`}
                >
                  Sudoku
                </span>
              </div>
              <div className="flex items-center gap-1">
                {gameStatus.ernigram ? (
                  <CheckCircle2 size={20} className="text-sky-500" />
                ) : (
                  <Circle size={20} className="text-gray-300" />
                )}
                <span
                  className={`text-sm ${gameStatus.ernigram ? 'text-sky-600 font-medium' : 'text-gray-400'}`}
                >
                  ERNIgram
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
