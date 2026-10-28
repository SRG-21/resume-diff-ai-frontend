import { useContext } from 'react';
import { AuthContext } from './auth-context';
import type { AuthContextType } from '../types/api';

export const useAuth = (): AuthContextType => useContext(AuthContext);
