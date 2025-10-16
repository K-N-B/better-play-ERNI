interface UserProfile {
  name: string;
  role: string;
  currentStreak: number;
  maxStreak: number;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onLogout?: () => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
  onLogout,
}: UserProfileModalProps) {
  if (!isOpen) return null;

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
        <div className="flex flex-cols-2 items-center mb-6">
          <div className="w-16 h-16 bg-sky-400 rounded-full mb-3"></div>
          <div className="text-left ms-3">
            <div className="font-bold text-lg text-[#0A3161]">{user.name}</div>
            <div className="text-sm text-gray-500">{user.role}</div>
          </div>
          
        </div>

        {/* Stats section */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-sky-100 rounded-xl py-4">
            <div className="text-2xl font-bold text-[#0A3161]">{user.currentStreak} days</div>
            <div className="text-sm text-gray-700">Current streak</div>
          </div>
          <div className="bg-sky-100 rounded-xl py-4">
            <div className="text-2xl font-bold text-[#0A3161]">{user.maxStreak} days</div>
            <div className="text-sm text-gray-700">Max streak</div>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={onLogout}
          className="mt-6 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-xl transition"
        >
          Log-out
        </button>
      </div>
    </div>
  );
}
