import { useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/authContext';
import { LoadingSpinner } from '../components/ui/loadingSpinner'; // Import useAuth

export default function AuthCallback() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for the AuthContext to finish its initial check
    if (!isLoading) {
      if (user) {
        // If AuthContext found a user, redirect home
        console.log('[AuthCallback] User found, navigating home.');
        navigate('/', { replace: true });
      } else {
        // If AuthContext didn't find a user (login failed?), redirect to login
        console.log('[AuthCallback] No user found after auth check, navigating to login.');
        navigate('/login', { replace: true });
      }
    }
  }, [user, isLoading, navigate]);

  return (
    <>
    <LoadingSpinner fullPage={true} />
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-400 via-purple-500 to-pink-400">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-2">{status}</div>
        <p className="text-gray-600">Please wait...</p>
      </div>
    </div>
    </>
  );
}