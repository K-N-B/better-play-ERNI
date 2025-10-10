import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Trophy, Target, Flame, Calendar } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-900 p-2 rounded-lg mr-3">
                <span className="text-white text-xl font-bold">e</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-gray-800 font-bold text-2xl">ERNI</span>
                <span className="text-blue-600 font-bold text-2xl ml-1">PUZZLE</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.firstName}! 👋
          </h1>
          <p className="text-gray-600">Ready to solve today's puzzle?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Trophy className="w-8 h-8 text-yellow-500" />}
            label="Total Points"
            value={user.totalPoints.toLocaleString()}
            bgColor="bg-yellow-50"
          />
          <StatCard
            icon={<Target className="w-8 h-8 text-blue-500" />}
            label="Puzzles Completed"
            value={user.puzzlesCompleted.toString()}
            bgColor="bg-blue-50"
          />
          <StatCard
            icon={<Flame className="w-8 h-8 text-orange-500" />}
            label="Current Streak"
            value={`${user.currentStreak} days`}
            bgColor="bg-orange-50"
          />
          <StatCard
            icon={<Calendar className="w-8 h-8 text-green-500" />}
            label="Longest Streak"
            value={`${user.longestStreak} days`}
            bgColor="bg-green-50"
          />
        </div>

        {/* Today's Puzzle */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Today's Puzzle</h2>
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <Target className="w-12 h-12 text-blue-600" />
            </div>
            <p className="text-gray-600 mb-6">
              Puzzle feature coming soon! Stay tuned for daily challenges.
            </p>
            <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              Start Puzzle
            </button>
          </div>
        </div>

        {/* Leaderboard Preview */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Leaderboard</h2>
          <div className="text-center py-8 text-gray-500">
            Leaderboard coming soon...
          </div>
        </div>
      </main>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, bgColor }) => {
  return (
    <div className={`${bgColor} rounded-xl p-6 border border-gray-200`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
};