// A route wrapper. It uses useMsal() to check for an authenticated user. If !isAuthenticated, it uses Maps from react-router-dom to redirect to /login.\

// import React from 'react';
import { useAuth } from '../../hooks/authContext';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = () => {
  const { user } = useAuth();

  if (!user) {
    // If no user, redirect to login
    return <Navigate to="/login" replace />;
  }

  // If user is logged in, render the child route (e.g., HomePage)
  return <Outlet />;
};
