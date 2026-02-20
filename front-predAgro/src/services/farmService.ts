import { apiClient } from './httpClient';
import type { Farm } from '../types/domain';

export interface FarmPayload {
  name: string;
  city?: string;
  state?: string;
}

export const farmService = {
  list: (token: string) => apiClient.get<{ farms: Farm[] }>('/farms', { token }),
  create: (token: string, payload: FarmPayload) => apiClient.post<{ farm: Farm }>('/farms', payload, { token }),
  getById: (token: string, farmId: string) => apiClient.get<{ farm: Farm }>(`/farms/${farmId}`, { token }),
  update: (token: string, farmId: string, payload: Partial<FarmPayload>) =>
    apiClient.put<{ farm: Farm }>(`/farms/${farmId}`, payload, { token }),
  remove: (token: string, farmId: string) => apiClient.delete<void>(`/farms/${farmId}`, { token }),
};
