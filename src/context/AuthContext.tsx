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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on app start
    const checkAuthState = () => {
      const isAuthenticated = authService.isAuthenticated();
      const user = authService.getCurrentUser();

      setAuthState({
        isAuthenticated,
        user,
        token: null, // We're not using tokens in this implementation
      });
      setIsLoading(false);
    };

    // Small delay to ensure localStorage is ready
    setTimeout(checkAuthState, 0);
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

  // Don't render anything while checking auth state
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>;
  }

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
