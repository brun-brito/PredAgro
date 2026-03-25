import { apiClient } from './httpClient';
import { authenticateWithGooglePopup, clearFirebaseAuthSession } from './firebaseClient';
import type { AuthCredentials, AuthResponse, RegisterPayload } from '../types/domain';

interface MessageResponse {
  message: string;
}

export const authService = {
  login: (credentials: AuthCredentials) => apiClient.post<AuthResponse>('/auth/login', credentials),
  register: (payload: RegisterPayload) => apiClient.post<AuthResponse>('/auth/register', payload),
  forgotPassword: (email: string) => apiClient.post<MessageResponse>('/auth/forgot-password', { email }),
  authenticateWithGoogle: async () => {
    const { idToken } = await authenticateWithGooglePopup();

    try {
      return await apiClient.post<AuthResponse>('/auth/google', { idToken });
    } catch (error) {
      await clearFirebaseAuthSession();
      throw error;
    }
  },
  clearProviderSession: () => clearFirebaseAuthSession(),
};
