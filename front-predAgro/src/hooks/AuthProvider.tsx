import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { authService } from '../services/authService';
import type { RegisterPayload, User } from '../types/domain';
import { AuthContext, type AuthContextData } from './auth-context';
import { clearCache } from '../utils/cache';
import { ApiError, configureApiClientAuth } from '../services/httpClient';

const SESSION_STORAGE_KEY = 'predagro.session';
const SESSION_REFRESH_BUFFER_MS = 5 * 60 * 1000;
type SessionProvider = 'password' | 'google';

interface SessionData {
  token: string;
  user: User;
  refreshToken?: string;
  provider?: SessionProvider;
}

function isSessionProvider(value: unknown): value is SessionProvider {
  return value === 'password' || value === 'google';
}

function readBase64UrlPayload(token: string) {
  const [, payload] = token.split('.');

  if (!payload) {
    return null;
  }

  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

  try {
    return JSON.parse(window.atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
}

function getRefreshDelay(token: string) {
  const payload = readBase64UrlPayload(token);
  const expirationTime = payload?.exp ? payload.exp * 1000 : null;

  if (!expirationTime) {
    return null;
  }

  return Math.max(expirationTime - Date.now() - SESSION_REFRESH_BUFFER_MS, 0);
}

function readStoredSession(): SessionData | null {
  const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawSession) as Partial<SessionData>;
    if (!parsed.token || !parsed.user) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return {
      token: parsed.token,
      user: parsed.user,
      refreshToken: parsed.refreshToken,
      provider: isSessionProvider(parsed.provider) ? parsed.provider : undefined,
    };
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

const initialSession = readStoredSession();

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<SessionData | null>(initialSession);

  const token = session?.token ?? null;
  const user = session?.user ?? null;

  const applySession = useCallback((nextSession: SessionData) => {
    setSession((current) => {
      if (current?.token && current.token !== nextSession.token) {
        clearCache();
      }

      return nextSession;
    });
  }, []);

  useEffect(() => {
    if (!session) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await authService.login({ email, password });

    applySession({
      token: response.token,
      user: response.user,
      refreshToken: response.refreshToken,
      provider: 'password',
    });
  }, [applySession]);

  const signUp = useCallback(async (payload: RegisterPayload) => {
    const response = await authService.register(payload);

    applySession({
      token: response.token,
      user: response.user,
      refreshToken: response.refreshToken,
      provider: 'password',
    });
  }, [applySession]);

  const signInWithGoogle = useCallback(async () => {
    const response = await authService.authenticateWithGoogle();

    applySession({
      token: response.token,
      user: response.user,
      refreshToken: response.refreshToken,
      provider: 'google',
    });
  }, [applySession]);

  const signOut = useCallback(() => {
    setSession(null);
    clearCache();
    void authService.clearProviderSession();
  }, []);

  const updateAuthenticatedUser = useCallback((nextUser: User) => {
    setSession((current) => (current ? { ...current, user: nextUser } : current));
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (!session?.token || !session.user) {
      return null;
    }

    if (session.provider === 'google') {
      try {
        const response = await authService.refreshGoogleSession();
        applySession({
          token: response.token,
          user: response.user,
          refreshToken: response.refreshToken,
          provider: 'google',
        });
        return response.token;
      } catch (error) {
        const shouldResetSession =
          error instanceof ApiError
            ? error.status === 401
            : error instanceof Error && error.message.includes('Sessão Google não encontrada');

        if (shouldResetSession) {
          setSession(null);
          clearCache();
          await authService.clearProviderSession();
          return null;
        }

        throw error;
      }
    }

    if (session.provider !== 'password' || !session.refreshToken) {
      setSession(null);
      clearCache();
      return null;
    }

    try {
      const response = await authService.refreshSession(session.refreshToken);
      applySession({
        token: response.token,
        user: response.user,
        refreshToken: response.refreshToken,
        provider: 'password',
      });
      return response.token;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 400 || error.status === 401)) {
        setSession(null);
        clearCache();
        return null;
      }

      throw error;
    }
  }, [applySession, session]);

  useEffect(() => {
    configureApiClientAuth({
      refreshAccessToken,
    });

    return () => {
      configureApiClientAuth(null);
    };
  }, [refreshAccessToken]);

  useEffect(() => {
    if (!session?.token || !session.provider) {
      return;
    }

    const delay = getRefreshDelay(session.token);
    if (delay === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void refreshAccessToken().catch(() => {
        // Requests can still try a retry-based refresh if the scheduled refresh fails.
      });
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [refreshAccessToken, session?.provider, session?.token]);

  const contextValue = useMemo<AuthContextData>(
    () => ({
      token,
      user,
      isLoading: false,
      isAuthenticated: Boolean(token && user),
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      updateAuthenticatedUser,
    }),
    [token, user, signIn, signUp, signInWithGoogle, signOut, updateAuthenticatedUser]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
