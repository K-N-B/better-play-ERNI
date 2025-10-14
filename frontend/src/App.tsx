import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider, useIsAuthenticated, useMsal } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './authConfig';
import { authAPI } from './api/authAPI';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';

const msalInstance = new PublicClientApplication(msalConfig);

// Component to handle authentication and role-based routing
const AuthenticatedApp = () => {
  const isAuthenticated = useIsAuthenticated();
  const { accounts, instance } = useMsal();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initUser = async () => {
      if (isAuthenticated && accounts.length > 0) {
        try {
          // Get the ID token
          const response = await instance.acquireTokenSilent({
            scopes: ['User.Read'],
            account: accounts[0],
          });

          // Store token for API calls
          sessionStorage.setItem('msal.idtoken', response.idToken);

          // Sync user with backend
          await authAPI.syncUser();

          // Get user roles from the token
          const roles = (response.idTokenClaims as any)?.roles || ['User'];
          setUserRole(roles.includes('Admin') ? 'Admin' : 'User');
        } catch (error) {
          console.error('Failed to initialize user:', error);
          setUserRole('User'); // Default to User role
        }
      }
      setLoading(false);
    };

    initUser();
  }, [isAuthenticated, accounts, instance]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={userRole === 'Admin' ? '/admin' : '/dashboard'} replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/admin"
        element={
          isAuthenticated && userRole === 'Admin' ? (
            <AdminDashboard />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <UserDashboard />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <BrowserRouter>
        <AuthenticatedApp />
      </BrowserRouter>
    </MsalProvider>
  );
}

export default App;