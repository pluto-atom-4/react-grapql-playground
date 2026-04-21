'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  ReactElement,
  useRef,
} from 'react';

export interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'auth_token';

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [token, setToken] = useState<string | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current && typeof window !== 'undefined') {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      setToken(storedToken);
      isInitialized.current = true;
    }
  }, []);

  const login = (newToken: string): void => {
    setToken(newToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    }
  };

  const logout = (): void => {
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  };

  const value: AuthContextType = {
    token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
