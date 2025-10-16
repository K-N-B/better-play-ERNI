// UserProfileModal.tsx
import { useEffect, useState } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  total_points: number;
  avatar_url?: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
}: UserProfileModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchUserData();
    }
  }, [isOpen]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('http://localhost:8000/auth/user/', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8000/auth/logout/', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Redirect anyway
      window.location.href = '/login';
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="bg-white rounded-3xl p-6 w-[380px] shadow-xl">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-3xl p-6 w-[380px] shadow-xl relative text-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-red-600 font-bold text-xl hover:text-red-800"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Profile info */}
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 bg-sky-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user.display_name.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase()}
          </div>
          <div className="text-left ms-3">
            <div className="font-bold text-lg text-[#0A3161]">
              {user.display_name || user.username}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>

        {/* Stats section */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-sky-100 rounded-xl py-4">
            <div className="text-2xl font-bold text-[#0A3161]">{user.total_points}</div>
            <div className="text-sm text-gray-700">Total Points</div>
          </div>
          <div className="bg-sky-100 rounded-xl py-4">
            <div className="text-2xl font-bold text-[#0A3161]">0 days</div>
            <div className="text-sm text-gray-700">Current streak</div>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="mt-6 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-xl transition"
        >
          Log-out
        </button>
      </div>
    </div>
  );
}