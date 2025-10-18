// The top navigation bar. It contains Link components from react-router-dom to your main pages (Home, Leaderboards) and includes the NotificationsBell component.

import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/authContext';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600">
          ERNI Puzzles
        </Link>
        <div className="flex items-center space-x-4">
          <Link to="/leaderboards" className="text-gray-600 hover:text-blue-600">
            Leaderboards
          </Link>
          <span className="text-gray-700">Hi, {user?.username}</span>
          <button
            onClick={logout}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};