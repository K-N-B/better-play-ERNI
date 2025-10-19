
import { useAuth } from '../../hooks/authContext';
import type { UserProfile } from '../../types/user';
import { X, LogOut, Star, TrendingUp } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

export default function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
  const { logout } = useAuth(); // Get the global logout function

  if (!isOpen) return null;

  return (
    // Modal Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-sm"
        onClick={e => e.stopPropagation()} // Prevent click from closing modal
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">My Profile</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-sky-400 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {user?.username.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.username}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <p className="text-sm text-gray-500">Team: {user?.department?.name || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-center">
            <div className="bg-gray-100 p-4 rounded-lg">
              <Star className="mx-auto text-yellow-500 mb-1" />
              <div className="text-2xl font-bold">{user?.total_points_alltime || 0}</div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
              <TrendingUp className="mx-auto text-green-500 mb-1" />
              <div className="text-2xl font-bold">{user?.streak_count || 0}</div>
              <div className="text-sm text-gray-600">Current Streak</div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}