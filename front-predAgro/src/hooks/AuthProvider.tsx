import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { authService } from '../services/authService';
import type { RegisterPayload, User } from '../types/domain';
import { AuthContext, type AuthContextData } from './auth-context';

const SESSION_STORAGE_KEY = 'predagro.session';

interface SessionData {
  token: string;
  user: User;
}

function readStoredSession(): SessionData | null {
  const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as SessionData;
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

const initialSession = readStoredSession();

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(initialSession?.token ?? null);
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null);

  useEffect(() => {
    if (!token || !user) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token, user }));
  }, [token, user]);

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await authService.login({ email, password });

    setToken(response.token);
    setUser(response.user);
  }, []);

  const signUp = useCallback(async (payload: RegisterPayload) => {
    const response = await authService.register(payload);

    setToken(response.token);
    setUser(response.user);
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const contextValue = useMemo<AuthContextData>(
    () => ({
      token,
      user,
      isLoading: false,
      isAuthenticated: Boolean(token && user),
      signIn,
      signUp,
      signOut,
    }),
    [token, user, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
