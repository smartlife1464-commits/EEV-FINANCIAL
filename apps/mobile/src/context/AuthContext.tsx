import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@eev/shared-types';
import { MobileStorage } from '../services/storage';

export interface MobileUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: MobileUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: MobileUser) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const MobileAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await MobileStorage.getToken();
        const savedUser = await MobileStorage.getUser();
        if (token && savedUser) {
          setUser(savedUser);
        } else {
          // Default mobile session for immediate testing in Leader mode
          const defaultLeader: MobileUser = {
            id: 'dev-leader-id',
            email: 'leader@espritvie.org',
            name: 'Leader Principal',
            role: UserRole.LEAD_PASTOR,
          };
          await MobileStorage.saveToken('dev-token-leader');
          await MobileStorage.saveUser(defaultLeader);
          setUser(defaultLeader);
        }
      } catch (err) {
        console.warn('Erreur chargement session mobile:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (token: string, userData: MobileUser) => {
    await MobileStorage.saveToken(token);
    await MobileStorage.saveUser(userData);
    setUser(userData);
  };

  const logout = async () => {
    await MobileStorage.removeToken();
    await MobileStorage.removeUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useMobileAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useMobileAuth must be used within a MobileAuthProvider');
  }
  return ctx;
}
