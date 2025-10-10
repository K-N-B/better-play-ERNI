import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';
import { useAuthStore } from '../store/authStore';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-900 p-3 rounded-lg mr-3">
              <span className="text-white text-2xl font-bold">e</span>
            </div>
            <div className="flex items-baseline">
              <span className="text-gray-800 font-bold text-3xl">ERNI</span>
              <span className="text-blue-600 font-bold text-3xl ml-1">PUZZLE</span>
              <span className="bg-yellow-400 text-gray-800 text-xs font-bold px-2 py-1 rounded ml-2">
                BETA
              </span>
            </div>
          </div>
          <p className="text-gray-600">Daily puzzle challenges for ERNI team</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600 text-center mt-2">
              {isLogin ? 'Sign in to continue your puzzle journey' : 'Join the ERNI puzzle community'}
            </p>
          </div>

          {isLogin ? <LoginForm /> : <RegisterForm />}

          <div className="mt-6 text-center">
            <span className="text-gray-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 font-semibold hover:text-blue-700"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>

        {/* Admin Login Link */}
{/* Admin Login Link */}
<div className="mt-6 text-center">
  <a
    href="http://localhost:8000/admin"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
  >
    <svg
      className="w-4 h-4 mr-1"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
    Admin Login
  </a>
</div>
      </div>
    </div>
  );
};