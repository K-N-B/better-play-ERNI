import React, { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { Trophy, Flame, TrendingUp, LogOut, Award } from 'lucide-react';
import { userAPI } from '../api/userAPI';
import logoImage from '../assets/image-removebg-preview.png';

interface UserStats {
  daily_points: number;
  weekly_points: number;
  monthly_points: number;
  all_time_points: number;
  streak_count: number;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string | null;
  points: number;
  streak_count: number;
}

const UserDashboard = () => {
  const { instance, accounts } = useMsal();
  const [stats, setStats] = useState<UserStats>({
    daily_points: 0,
    weekly_points: 0,
    monthly_points: 0,
    all_time_points: 0,
    streak_count: 0,
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('all_time');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    try {
      const [statsRes, leaderboardRes] = await Promise.all([
        userAPI.getStats(),
        userAPI.getLeaderboard(selectedPeriod),
      ]);
      setStats(statsRes.data);
      setLeaderboard(leaderboardRes.data.leaderboard);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    instance.logoutRedirect();
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'daily': return 'Today';
      case 'weekly': return 'This Week';
      case 'monthly': return 'This Month';
      default: return 'All Time';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Logo" className="h-10" />
            <span className="text-xl font-semibold text-gray-800">Erni Puzzle</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">{accounts[0]?.name}</p>
              <p className="text-xs text-gray-500">Player</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {accounts[0]?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-600">Ready to solve today's puzzle?</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">Today</p>
              <div className="bg-blue-100 p-2 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-900" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.daily_points}</p>
            <p className="text-xs text-gray-500 mt-1">points</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">This Week</p>
              <div className="bg-green-100 p-2 rounded-lg">
                <Award className="w-4 h-4 text-green-900" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.weekly_points}</p>
            <p className="text-xs text-gray-500 mt-1">points</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">All Time</p>
              <div className="bg-purple-100 p-2 rounded-lg">
                <Trophy className="w-4 h-4 text-purple-900" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.all_time_points}</p>
            <p className="text-xs text-gray-500 mt-1">points</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">Streak</p>
              <div className="bg-orange-100 p-2 rounded-lg">
                <Flame className="w-4 h-4 text-orange-900" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.streak_count}</p>
            <p className="text-xs text-gray-500 mt-1">days</p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Leaderboard
            </h2>
            <div className="flex gap-2">
              {['daily', 'weekly', 'monthly', 'all_time'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                    selectedPeriod === period
                      ? 'bg-blue-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period === 'all_time' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">Top performers - {getPeriodLabel()}</p>
            <div className="space-y-3">
              {leaderboard.slice(0, 10).map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    entry.id === accounts[0]?.localAccountId
                      ? 'bg-blue-50 border-2 border-blue-200'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0
                          ? 'bg-yellow-400 text-yellow-900'
                          : index === 1
                          ? 'bg-gray-300 text-gray-700'
                          : index === 2
                          ? 'bg-orange-400 text-orange-900'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {entry.name}
                        {entry.id === accounts[0]?.localAccountId && (
                          <span className="ml-2 text-xs text-blue-600 font-semibold">(You)</span>
                        )}
                      </p>
                      {entry.streak_count > 0 && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                          {entry.streak_count} day streak
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{entry.points}</p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;