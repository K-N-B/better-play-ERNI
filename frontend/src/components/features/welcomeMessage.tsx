// src/components/features/welcomeMessage.tsx - COMPLETE VERSION

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/authContext';
import { getTodaySubmissions } from '../../api/gameService';
import type { Submission } from '../../types/game';
import { CheckCircle2, Circle } from 'lucide-react';

const TOTAL_DAILY_PUZZLES = 3;

export const WelcomeMessage = () => {
    const { user } = useAuth();
    const [submissionsToday, setSubmissionsToday] = useState<Submission[]>([]);
    const [loadingStats, setLoadingStats] = useState(false);

    useEffect(() => {
        if (user) {
            setLoadingStats(true);
            getTodaySubmissions()
                .then(data => {
                    setSubmissionsToday(data);
                })
                .catch(err => {
                    console.error("Failed to fetch today's submissions:", err);
                    setSubmissionsToday([]);
                })
                .finally(() => {
                    setLoadingStats(false);
                });
        } else {
            setSubmissionsToday([]);
            setLoadingStats(false);
        }
    }, [user]);

    if (!user) return null;

    const puzzlesCompletedToday = submissionsToday.length;
    const puzzlesLeftToday = Math.max(0, TOTAL_DAILY_PUZZLES - puzzlesCompletedToday);
    const dailyScore = submissionsToday.reduce((sum, sub) => sum + sub.points_awarded, 0);

    // ✅ NEW: Determine which games were completed
    const completedGames = submissionsToday.map(s => s.puzzle_type);
    const gameStatus = {
        wordle: completedGames.includes('wordlepuzzle'),
        sudoku: completedGames.includes('sudoku'),
        ernigram: completedGames.includes('ernigram')
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
                            You still have <strong className="text-primary">{puzzlesLeftToday}</strong> puzzle
                            {puzzlesLeftToday !== 1 ? 's' : ''} left to play today. Maybe you're up for a challenge?
                        </p>
                    ) : (
                        <p className="text-black">
                            You've completed all puzzles for today! Great job! 🎉
                        </p>
                    )}

                    <p className="text-black mt-1">
                        You've earned <strong className="text-primary">{dailyScore} pts</strong> today!
                    </p>

                    {/* ✅ NEW: Visual Progress Tracker */}
                    <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-gray-700">Today's Progress:</p>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                                {gameStatus.wordle ? (
                                    <CheckCircle2 size={20} className="text-emerald-500" />
                                ) : (
                                    <Circle size={20} className="text-gray-300" />
                                )}
                                <span className={`text-sm ${gameStatus.wordle ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                                    Wordle
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                {gameStatus.sudoku ? (
                                    <CheckCircle2 size={20} className="text-pink-500" />
                                ) : (
                                    <Circle size={20} className="text-gray-300" />
                                )}
                                <span className={`text-sm ${gameStatus.sudoku ? 'text-pink-600 font-medium' : 'text-gray-400'}`}>
                                    Sudoku
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                {gameStatus.ernigram ? (
                                    <CheckCircle2 size={20} className="text-sky-500" />
                                ) : (
                                    <Circle size={20} className="text-gray-300" />
                                )}
                                <span className={`text-sm ${gameStatus.ernigram ? 'text-sky-600 font-medium' : 'text-gray-400'}`}>
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