import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, LoginResponse } from '../types/Auth';
import { authService } from '../services/authService';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  });

  useEffect(() => {
    // Check if user is already logged in on app start
    const isAuthenticated = authService.isAuthenticated();
    const user = authService.getCurrentUser();

    setAuthState({
      isAuthenticated,
      user,
      token: null, // We're not using tokens in this implementation
    });
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const user = await authService.login({ email, password });
      setAuthState({
        isAuthenticated: true,
        user,
        token: null,
      });
    } catch (error) {
      throw error;
    }
  };

  const logout = (): void => {
    authService.logout();
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
