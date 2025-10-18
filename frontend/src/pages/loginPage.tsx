// A simple page that centers the LoginButton for unauthenticated users.

import { useAuth } from '../hooks/authContext';
import { Navigate } from 'react-router-dom';

export const LoginPage = () => {
  const { login, user, isLoading } = useAuth();

  // If user is already logged in, redirect to home
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="p-8 bg-white shadow-md rounded-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Welcome!</h1>
        <p className="mb-4 text-center">This is a mock login for development.</p>
        <div className="flex flex-col space-y-4">
          <button
            onClick={() => login('existing')}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Loading...' : 'Login as Existing User'}
          </button>
          <button
            onClick={() => login('new')}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Loading...' : 'Login as New User'}
          </button>
        </div>
      </div>
    </div>
  );
};