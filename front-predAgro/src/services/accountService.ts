import { apiClient } from './httpClient';
import type { AccountProfile, UpdateProfilePayload } from '../types/domain';

export const accountService = {
  getProfile: (token: string) => apiClient.get<AccountProfile>('/account/me', { token }),
  updateProfile: (token: string, payload: UpdateProfilePayload) =>
    apiClient.put<AccountProfile>('/account/me', payload, { token }),
};
