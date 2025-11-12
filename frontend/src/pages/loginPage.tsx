import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AlertCircle, Shield } from 'lucide-react';
import logoImage from '../assets/image-removebg-preview.png';
// Import your new service function
import { getLoginRedirectUrl } from '../api/authService';
import { useAuth } from '../hooks/authContext'; // Import useAuth
import { LoadingSpinner } from '../components/ui/loadingSpinner';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, isLoading: authLoading } = useAuth(); // Get user from context

  if (authLoading) {
    return <LoadingSpinner fullPage={true} />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getLoginRedirectUrl();
      if (data.auth_url) {
        window.location.href = data.auth_url; 
      } else {
        setError('Failed to get authorization URL');
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ... (keep all your original JSX: Header, Main Content, Card, Button, etc.) ... */}
      {/* ... The button's onClick={handleMicrosoftLogin} will work perfectly ... */}

      {/* Main Content (Pasting your JSX for clarity) */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Logo + Tagline */}
          <div className="text-center mb-8">
            <img
              src={logoImage}
              alt="Welcome Back"
              className="mx-auto mb-2 max-w-[600px] w-full h-auto object-contain"
            />
            <p className="text-gray-600">Sign in to access your puzzles</p>
          </div>

          {/* Card */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Microsoft Login Button */}
            <button
              onClick={handleMicrosoftLogin}
              disabled={loading}
              className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3 mb-4"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Redirecting...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Sign in with Microsoft</span>
                </>
              )}
            </button>
            

            
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  Secure SSO Authentication
                </span>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-gray-700 font-medium mb-1">
                    Personal Single Sign-On (For now)
                  </p>
                  <p className="text-gray-600 text-xs">
                    Protected by Microsoft Entra ID with multi-factor
                    authentication
                  </p>
                </div>
              </div>
            </div>
          

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-gray-500">
              <p>© 2025 ERNI Puzzle Platform</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}