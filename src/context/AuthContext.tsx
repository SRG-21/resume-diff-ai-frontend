import React, { useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, LoginRequest, SignupRequest, LoginResponse } from '../types/api';
import { AuthContext } from './auth-context';
import { API_BASE_URL, apiFetch, AUTH_LOGOUT_EVENT } from '../api/client';
import {
  clearAuthData,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  storeAuthData,
} from '../api/tokens';
import { track } from '../analytics';

interface AuthProviderProps {
  children: ReactNode;
}

const postJson = async (path: string, body: unknown): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const detail = errorData.detail;
    const message = Array.isArray(detail)
      ? detail.map((d: { msg?: string }) => String(d?.msg ?? '').replace(/^Value error, /, '')).join('. ')
      : typeof detail === 'string'
        ? detail
        : detail?.message;
    throw new Error(message || 'Request failed');
  }
  return response.json();
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore the session on first load
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = getStoredUser();
      if (storedUser && getAccessToken()) {
        try {
          // apiFetch refreshes an expired access token transparently
          const response = await apiFetch('/auth/validate');
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            clearAuthData();
          }
        } catch {
          // Server not reachable: keep the local user so the UI still loads
          setUser(storedUser);
        }
      } else if (getRefreshToken()) {
        clearAuthData();
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Sign out when the API client gives up refreshing the session
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
  }, []);

  const acceptTokens = useCallback((response: LoginResponse) => {
    storeAuthData(response);
    setUser(response.user);
  }, []);

  const authenticate = useCallback(
    async (path: string, body: unknown, fallbackMessage: string, event: string) => {
      setIsLoading(true);
      setError(null);
      try {
        acceptTokens(await postJson(path, body));
        track(event);
      } catch (err) {
        const message = err instanceof Error && err.message ? err.message : fallbackMessage;
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [acceptTokens],
  );

  const login = useCallback(
    (credentials: LoginRequest) => authenticate('/auth/login', credentials, 'Login failed', 'login'),
    [authenticate],
  );

  const signup = useCallback(
    (data: SignupRequest) => authenticate('/auth/signup', data, 'Signup failed', 'signup'),
    [authenticate],
  );

  const loginWithGoogle = useCallback(
    (credential: string) => authenticate('/auth/google', { credential }, 'Google sign-in failed', 'login_google'),
    [authenticate],
  );

  const refreshUser = useCallback(async () => {
    const response = await apiFetch('/auth/me');
    if (response.ok) {
      const fresh: User = await response.json();
      setUser(fresh);
      localStorage.setItem('resume_diff_user', JSON.stringify(fresh));
    }
  }, []);

  const logout = useCallback(async () => {
    if (getAccessToken()) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        });
      } catch {
        // Ignore server errors during logout
      }
    }
    clearAuthData();
    setUser(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        signup,
        loginWithGoogle,
        acceptTokens,
        refreshUser,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
