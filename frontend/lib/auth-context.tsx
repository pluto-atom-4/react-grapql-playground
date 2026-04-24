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

function decodeJWT(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode payload (second part)
    const payload = JSON.parse(globalThis.atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
      exp?: number;
    };

    return payload;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return false;
  }
  return payload.exp * 1000 < Date.now();
}

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

  // Check token expiry periodically
  useEffect(() => {
    if (!isInitialized.current) return;

    const checkTokenExpiry = (): void => {
      if (typeof window === 'undefined') return;

      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      if (storedToken && isTokenExpired(storedToken)) {
        logout();
      }
    };

    // Check on mount
    checkTokenExpiry();

    // Check periodically (every 10 seconds)
    const interval = globalThis.setInterval(checkTokenExpiry, 10000);

    return (): void => {
      globalThis.clearInterval(interval);
    };
  }, [isInitialized]);

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
