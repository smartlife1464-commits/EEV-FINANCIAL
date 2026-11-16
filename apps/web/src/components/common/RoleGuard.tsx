import React from 'react';
import { Navigate } from 'react-router-dom';
import { UserRole } from '@eev/shared-types';
import { useAuth } from '../../context/AuthContext';

interface RoleGuardProps {
  roles: UserRole[];
  children: React.ReactNode;
}

/**
 * Restreint une page à certains rôles (l'API applique aussi ces contrôles ;
 * ce garde évite simplement d'afficher une page vide en erreur 403).
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ roles, children }) => {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};
