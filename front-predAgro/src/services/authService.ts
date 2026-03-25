import { apiClient } from './httpClient';
import {
  authenticateWithGooglePopup,
  clearFirebaseAuthSession,
  refreshGoogleSession as refreshGoogleProviderSession,
} from './firebaseClient';
import type { AuthCredentials, AuthResponse, RegisterPayload } from '../types/domain';

interface MessageResponse {
  message: string;
}

export const authService = {
  login: (credentials: AuthCredentials) => apiClient.post<AuthResponse>('/auth/login', credentials),
  register: (payload: RegisterPayload) => apiClient.post<AuthResponse>('/auth/register', payload),
  refreshSession: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }),
  forgotPassword: (email: string) => apiClient.post<MessageResponse>('/auth/forgot-password', { email }),
  authenticateWithGoogle: async () => {
    const { idToken, refreshToken } = await authenticateWithGooglePopup();

    try {
      const response = await apiClient.post<Omit<AuthResponse, 'refreshToken'>>('/auth/google', { idToken });
      return {
        ...response,
        refreshToken,
      };
    } catch (error) {
      await clearFirebaseAuthSession();
      throw error;
    }
  },
  refreshGoogleSession: async () => {
    const { idToken, refreshToken } = await refreshGoogleProviderSession();

    try {
      const response = await apiClient.post<Omit<AuthResponse, 'refreshToken'>>('/auth/google', { idToken });
      return {
        ...response,
        refreshToken,
      };
    } catch (error) {
      await clearFirebaseAuthSession();
      throw error;
    }
  },
  clearProviderSession: () => clearFirebaseAuthSession(),
};
