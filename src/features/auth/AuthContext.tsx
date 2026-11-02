import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppUser } from '../../types';
import { backendService } from '../../services/api/backend-service';
import { userRepository } from '../../services/repositories';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (employeeNumber: string, passwordAttempt: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'sipat_auth_user_id';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    if (!user) return;
    const fresh = await userRepository.getById(user.id);
    if (fresh) setUser(fresh);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedId = localStorage.getItem(SESSION_KEY);
        if (storedId) {
          const found = await userRepository.getById(storedId);
          if (found && found.active) {
            setUser(found);
          } else {
            localStorage.removeItem(SESSION_KEY);
          }
        }
      } catch (err) {
        console.error('Error restoring session:', err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (employeeNumber: string, passwordAttempt: string) => {
    setLoading(true);
    try {
      const res = await backendService.resolveEmployeeLogin(employeeNumber, passwordAttempt);
      if (res.success && res.data) {
        setUser(res.data.user);
        localStorage.setItem(SESSION_KEY, res.data.user.id);
        return { success: true };
      }
      return { success: false, message: res.message || 'Matrícula ou senha inválida.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const switchUser = async (userId: string) => {
    const target = await userRepository.getById(userId);
    if (target) {
      setUser(target);
      localStorage.setItem(SESSION_KEY, target.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
