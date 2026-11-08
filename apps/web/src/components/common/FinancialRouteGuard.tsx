import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '@eev/shared-types';

interface FinancialRouteGuardProps {
  children: React.ReactNode;
}

export const FinancialRouteGuard: React.FC<FinancialRouteGuardProps> = ({ children }) => {
  const { user } = useAuth();

  // Les rôles protocole ne peuvent JAMAIS accéder aux routes financières
  if (user?.role === UserRole.PROTOCOL_LEAD || user?.role === UserRole.PROTOCOL_AGENT) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

