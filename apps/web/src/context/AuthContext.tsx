import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@eev/shared-types';
import { PERMISSIONS_MATRIX } from '@eev/business-rules';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Record<string, boolean>;
}

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: UserSession) => void;
  logout: () => void;
  hasPermission: (permissionKey: keyof typeof PERMISSIONS_MATRIX[UserRole]) => boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('eev_token');
    const savedUser = localStorage.getItem('eev_user');

    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser({
          ...parsed,
          permissions: PERMISSIONS_MATRIX[parsed.role as UserRole] || {},
        });
      } catch {
        localStorage.removeItem('eev_token');
        localStorage.removeItem('eev_user');
      }
    } else {
      // Aucun jeton actif : l'utilisateur doit obligatoirement s'authentifier sur /login
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userData: UserSession) => {
    localStorage.setItem('eev_token', token);
    localStorage.setItem('eev_user', JSON.stringify(userData));
    setUser({
      ...userData,
      permissions: PERMISSIONS_MATRIX[userData.role as UserRole] || {},
    });
  };

  const logout = () => {
    localStorage.removeItem('eev_token');
    localStorage.removeItem('eev_user');
    setUser(null);
  };

  const hasPermission = (permissionKey: keyof typeof PERMISSIONS_MATRIX[UserRole]): boolean => {
    if (!user) return false;
    const perms = PERMISSIONS_MATRIX[user.role];
    return perms ? Boolean(perms[permissionKey]) : false;
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

