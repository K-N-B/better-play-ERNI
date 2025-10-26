
import { useAuth } from '../../hooks/authContext';
import type { UserProfile } from '../../types/user';
import { X, LogOut, Star, Flame, Dumbbell } from 'lucide-react';

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div
        className="bg-white rounded-3xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()} // Prevent click from closing modal
      >
        {/* Header */}
        <div className="flex justify-between items-center ">
          <h3 className="text-lg font-semibold">My Profile</h3>
          <button onClick={onClose} className="text-red-500 hover:text-red-700">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="pt-4">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-sky-400 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {user?.username.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <div className="text-xl font-bold">{user?.username}</div>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <p className="text-sm text-gray-500">Team: {user?.department?.name || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 text-center">
            <div className="bg-gray-100 p-4 rounded-lg items-center justify-center flex flex-col">
              <div className="flex items-center justify-center gap-1">
                <div className="text-2xl font-bold">{user?.total_points_alltime || 0}</div>
                <Star size={24} className="fill-current text-yellow-500" />
              </div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg items-center justify-center flex flex-col">
              <div className="flex items-center justify-center gap-1">
                <div className="text-2xl font-bold">{user?.challenges_made_count || 0}</div>
                <Dumbbell className="fill-current text-amber-700" size={24} />
              </div>
              <div className="text-sm text-gray-600">Challenges made</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-center">
            <div className="bg-gray-100 p-4 rounded-lg items-center justify-center flex flex-col">
              <div className="flex items-center justify-center gap-1">
                <div className="text-2xl font-bold">{user?.current_streak_count || 0}</div>
                <Flame className="fill-current text-orange-500" size={24} />
              </div>
              <div className="text-sm text-gray-600">Current Streak</div>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg items-center justify-center flex flex-col">
              <div className="flex items-center justify-center gap-1">
                <div className="text-2xl font-bold">{user?.max_streak_count || 0}</div>
                <Flame className="fill-current text-red-500" size={24} />
              </div>
              <div className="text-sm text-gray-600">Max Streak</div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 shadow-red-700 shadow-[0_5px_0_0] active:shadow-[0_4px_0_0_rgba(0,0,0,0.15)] translate-y-[-2px] active:translate-y-0 text-white rounded-lg hover:bg-red-800 transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}