import { useMsal } from "@azure/msal-react";
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { accounts } = useMsal();
  
  if (accounts.length === 0) {
    return <Navigate to="/login" replace />;
  }

  // Check admin role from account claims
  if (requireAdmin) {
    const account = accounts[0];
    const roles = account.idTokenClaims?.roles as string[] || [];
    
    if (!roles.includes("Admin") && !roles.includes("Administrator")) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};