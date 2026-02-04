import { apiClient } from './httpClient';
import type { AuthCredentials, AuthResponse, RegisterPayload } from '../types/domain';

export const authService = {
  login: (credentials: AuthCredentials) => apiClient.post<AuthResponse>('/auth/login', credentials),
  register: (payload: RegisterPayload) => apiClient.post<AuthResponse>('/auth/register', payload),
};
