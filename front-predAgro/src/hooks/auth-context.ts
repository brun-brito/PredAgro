import { createContext } from 'react';
import type { RegisterPayload, User } from '../types/domain';

export interface AuthContextData {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
  updateAuthenticatedUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextData | undefined>(undefined);
