import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { Shield, AlertCircle } from 'lucide-react';

// Import the image file
import logoImage from '../assets/image-removebg-preview.png';

const ErniPuzzleLogo = () => (
  <div className="flex items-center gap-3">
  </div>
);

const LoginPage = () => {
  const { instance } = useMsal();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await instance.loginRedirect(loginRequest);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 py-4 px-6">
        <ErniPuzzleLogo />
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <div className="max-w-md w-full">
          {/* Login Card */}
          <div className="text-center mb-8">
            <img src={logoImage} alt="Welcome Back" className="mx-auto mb-2 max-w-[1000px] w-full h-auto object-contain" />
            <p className="text-gray-600">Sign in to access your puzzles</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* SSO Button */}
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3 mb-4"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Sign in with Microsoft</span>
                </>
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Secure SSO Authentication</span>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-blue-900 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-gray-700 font-medium mb-1">Enterprise Single Sign-On</p>
                  <p className="text-gray-600 text-xs">Protected by Microsoft Entra ID with multi-factor authentication</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;