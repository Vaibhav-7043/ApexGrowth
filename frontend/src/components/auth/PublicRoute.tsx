import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const PublicRoute: React.FC = () => {
  const { isAuthenticated, isOnboarded, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated && isOnboarded) {
    return <Navigate to="/" replace />;
  }

  if (isAuthenticated && !isOnboarded) {
    return <Navigate to="/onboarding/business" replace />;
  }

  return <Outlet />;
};
