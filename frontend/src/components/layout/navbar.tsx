// /src/components/layout/Navbar.tsx
import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import PrimaryButton from '../ui/primaryButton';
import UserProfileModal from '../features/userProfileModal';
import { useAuth } from '../../hooks/authContext';
import { navItems } from '../../data/navItems'; // <-- IMPORT YOUR DATA
import { NotificationsBell } from '../features/notificationBell';
import { Store, Star } from 'lucide-react';

export default function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const location = useLocation();

  const getUserInitial = () => {
    if (!user) return '?';
    const name = user.username;
    return name.charAt(0).toUpperCase();
  };

  const currentPoints = user?.current_points ?? 0;

  return (
    <header className="top-0 left-0 w-full bg-slate-50 shadow-md z-50 py-2">
      <div className="mx-auto w-full max-w-[80rem] border border-transparent bg-transparent rounded-lg transition-colors">
        <div className="flex items-center justify-between h-[4rem] px-6 py-6">
          {/* Left: Logo */}
          <a href="/" className="flex items-center space-x-2">
            <img className="h-14 w-auto" src={logo} alt="Namespace Logo" />
          </a>

          {/* Center: Navigation (This section is updated) */}
          <nav className="flex justify-center items-center space-x-6">
            {navItems.map((item, idx) => {
              if (item.name === '┃') {
                return (
                  <span
                    key={`separator-${idx}`}
                    className="font-semibold text-primary"
                  >
                    ┃
                  </span>
                );
              }
              if (item.path && item.activeClasses && item.hoverClasses) {
                const isActive = location.pathname === item.path;

                if (isActive) {
                  // --- Renders the 3D ACTIVE button ---
                  return (
                    <PrimaryButton
                      key={item.path}
                      text={item.name}
                      color={item.activeClasses} // Use activeClasses
                      path={item.path}
                    />
                  );
                } else {
                  // --- Renders the flat INACTIVE link with hover ---
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`relative inline-flex items-center justify-center h-10 px-5
                                  rounded-lg font-semibold text-lg tracking-wide 
                                  text-primary transition-colors
                                  ${item.hoverClasses}`} // Add hover classes
                    >
                      {item.name}
                    </Link>
                  );
                }
              }
              return null;
            })}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/shop"
              className=" text-gray-600 hover:text-primary rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              aria-label="Shop"
              title="Shop" // Tooltip
            >
              <Store size={24} />
            </Link>

            <NotificationsBell /> {/* <-- Place the bell here */}

            {!authLoading && user && ( // Only show if user is loaded
              <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-full text-sm font-semibold shadow-inner">
                <Star size={20} className="fill-current text-yellow-500" />
                <span>{currentPoints}</span>
              </div>
            )}
            {/* Right: Profile button */}
            <div className="flex items-center">
              {authLoading ? (
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
              ) : (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-10 h-10 bg-sky-400 rounded-full flex items-center justify-center text-white font-bold hover:bg-sky-500 transition"
                  title={user?.username || 'Profile'}
                >
                  {getUserInitial()}
                </button>
              )}

              <UserProfileModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={user}
              />
            </div>
          </div>
          
          
        </div>
      </div>
    </header>
  );
}