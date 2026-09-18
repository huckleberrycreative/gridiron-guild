import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, isAdmin, roleLoading, signOut } = useAuth();

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <div className="w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-foreground">Access denied</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This account does not have commissioner access.
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-6 text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Sign out and use another account
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
