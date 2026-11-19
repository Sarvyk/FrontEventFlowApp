import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  organizerOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false, organizerOnly = false }) => {
  const { isAuthenticated, isLoadingAuth, hasRole } = useAuth();

  if (isLoadingAuth) {
    return null; // или <div className="loading">Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !hasRole('Admin')) {
    return <Navigate to="/" replace />;
  }

  if (organizerOnly && !hasRole('Organizer')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;