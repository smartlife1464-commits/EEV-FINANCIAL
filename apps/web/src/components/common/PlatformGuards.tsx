import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';

/** Page masquée si le module correspondant est désactivé dans la console plateforme. */
export const ModuleGuard: React.FC<{ module: string; children: React.ReactNode }> = ({ module, children }) => {
  const { isModuleEnabled } = usePlatform();
  if (!isModuleEnabled(module)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

/** Console réservée aux administrateurs de la plateforme (l'API applique aussi ce contrôle). */
export const PlatformAdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user?.isPlatformAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};
