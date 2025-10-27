// /src/components/layout/Navbar.tsx
import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import PrimaryButton from '../ui/primaryButton';
import UserProfileModal from '../features/userProfileModal';
import { useAuth } from '../../hooks/authContext';
import { navItems, shopNavStyle, notificationNavStyle } from '../../data/navItems'; // <-- IMPORT YOUR DATA
import { ChallengeIcon } from '../features/challenge/challengeIcon';
import { Store, Star, Menu, X, Mountain } from 'lucide-react';
import clsx from 'clsx';


export default function Navbar() {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const location = useLocation();

  const getUserInitial = () => {
    if (!user) return '?';
    const name = user.username;
    return name.charAt(0).toUpperCase();
  };

  const currentPoints = user?.current_points ?? 0;
  const isShopActive = location.pathname === shopNavStyle.path;


  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 left-0 w-full bg-slate-50 shadow-md z-50 py-2">
      <div className="mx-auto w-full max-w-[80rem] rounded-lg transition-colors">
        <div className="flex items-center justify-between h-[4rem] px-6 py-6">
          {/* Left: Logo */}
          <a href="/" className="flex items-center space-x-2">
            <img className="h-12 w-auto" src={logo} alt="Namespace Logo" />
          </a>

          {/* Center: Navigation (This section is updated) */}
          <nav className="hidden lg:flex flex-grow justify-center items-center ">
            {navItems.map((item, idx) => {
              if (item.name === '┃') {
                return (
                  <span key={`separator-${idx}`} className="font-semibold text-primary mx-2"> ┃ </span>
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
                                  rounded-lg font-semibold text-base tracking-wide 
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
              to={shopNavStyle.path}
              // Conditionally apply classes using clsx
              className={clsx(
                // Base styles for the icon button
                'hidden lg:inline-flex items-center justify-center h-10 w-10 m-0 rounded-lg transition-all duration-150',
                // Active styles
                isShopActive && `active:translate-y-[2px] active:shadow-[0_3px_0_0] ${shopNavStyle.activeClasses}`,
                // Inactive styles
                !isShopActive && `text-primary ${shopNavStyle.hoverClasses}` // Apply hover from nav data
              )}
              aria-label="Shop"
              title="Shop"
            >
              <Store size={24} strokeWidth={2} />
            </Link>
            {/* --- End Shop Link/Icon --- */}

            {/* --- Pass active styles to NotificationsMountain --- */}
            <div className="hidden lg:block m-0">
              <ChallengeIcon
                activeClasses={notificationNavStyle.activeClasses}
                hoverClasses={notificationNavStyle.hoverClasses}
              />
            </div>


            {!authLoading && user && ( // Only show if user is loaded
              <div className="hidden lg:flex m-0 items-center space-x-1 bg-yellow-100 text-yellow-800 px-3 py-2 rounded-full text-lg font-bold shadow-inner">
                <span>{currentPoints}</span>
                <Star size={24} className="fill-current text-yellow-500" />
              </div>
            )}
            {/* Right: Profile button */}
            <div className="flex items-center m-0 ">
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

            {/* --- Hamburger Menu Button --- */}
            {/* Show only on small screens (md:hidden) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-primary rounded-md hover:bg-gray-100 focus:outline-none lg:hidden" // Only visible below md breakpoint
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            {/* --- End Hamburger Menu Button --- */}
          </div>

        </div>
      </div>

      {/* Show overlay only when mobile menu is open */}
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-black bg-opacity-20 backdrop-blur-sm lg:hidden", // Only visible below md breakpoint
          isMobileMenuOpen ? "block" : "hidden" // Toggle visibility
        )}
        onClick={() => setIsMobileMenuOpen(false)} // Close on overlay click
        aria-hidden="true"
      ></div>

      {/* Show menu content only when mobile menu is open */}
      <div
        className={clsx(
          "fixed top-0 right-0 z-50 w-64 h-full bg-slate-50 shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-5 pt-16"> {/* Add padding top for close button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
          <h2 className="text-lg text-center font-semibold mb-2 text-gray-800 pb-2">Menu</h2>
          <nav className="flex flex-col space-y-1">
            {/* Map over main navItems */}
            {navItems.map((item) => {
              // Ensure item has necessary properties
              // We'll use hoverClasses for the inactive state style
              if (item.path && item.activeClasses && item.hoverClasses) {
                const isActive = location.pathname === item.path;
                // No longer need: const Icon = item.IconComponent;

                // Always render a Link
                return (
                  <Link
                    key={`mobile-${item.path}`}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    // Apply styles conditionally using clsx
                    className={clsx(
                      // Base styles for all mobile links
                      "block px-3 py-2 rounded-md text-base font-medium transition-colors text-left", // Added text-center
                      // Apply activeClasses if isActive is true
                      isActive && `active:translate-y-[2px] active:shadow-[0_3px_0_0] ${item.activeClasses}`,
                      // Apply standard text + hoverClasses if inactive
                      !isActive && `text-primary ${item.hoverClasses}`
                    )}
                  >
                    {/* Just the text */}
                    {item.name}
                  </Link>
                );
              }
              // Skip separators
              return null;
            })}
            {/* Shop Link */}
            {[
              { path: '/shop', name: 'Shop', style: shopNavStyle},
              { path: '/challenges', name: 'Challenges', style: notificationNavStyle}
            ].map((linkItem) => {
              const isActive = location.pathname === linkItem.path;
              // Always render a Link
              return (
                <Link
                  key={`mobile-${linkItem.path}`}
                  to={linkItem.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={clsx(
                    // Base styles
                    "flex items-center justify-start gap-2 px-3 py-2 rounded-md text-base font-medium transition-colors", // Added justify-center
                    // Active styles
                    isActive && `active:translate-y-[2px] active:shadow-[0_3px_0_0] ${linkItem.style.activeClasses}`,
                    // Inactive styles
                    !isActive && `text-primary ${linkItem.style.hoverClasses}`
                  )}
                >
                  {linkItem.name}
                </Link>
              );
            })}
            {/* --- END Added Mobile Links --- */}

            {/* --- ADD Mobile Points Display --- */}
            {user && (
              <div className="mt-4">
                <div className="flex items-center justify-center space-x-1 bg-yellow-100 text-yellow-800 px-3 py-2  shadow-inner rounded-full text-base font-bold">
                  <Star size={20} className="fill-current text-yellow-500" />
                  <span>{currentPoints} Points</span>
                </div>
              </div>
            )}
            {/* --- END Mobile Points --- */}
          </nav>
        </div>
      </div>
    </header>
  );
}