import { createContext } from 'react';
import type { AuthContextType } from '../types/api';

export const initialAuthState: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => {},
  signup: async () => {},
  loginWithGoogle: async () => {},
  acceptTokens: () => {},
  refreshUser: async () => {},
  logout: async () => {},
  clearError: () => {},
};

export const AuthContext = createContext<AuthContextType>(initialAuthState);
