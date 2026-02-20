import { apiClient } from './httpClient';
import type { Field, FieldGeometry, WeatherSnapshot } from '../types/domain';

export interface FieldPayload {
  name: string;
  geometry: FieldGeometry;
}

export const fieldService = {
  listByFarm: (token: string, farmId: string) =>
    apiClient.get<{ fields: Field[] }>(`/farms/${farmId}/fields`, { token }),
  create: (token: string, farmId: string, payload: FieldPayload) =>
    apiClient.post<{ field: Field }>(`/farms/${farmId}/fields`, payload, { token }),
  getById: (token: string, farmId: string, fieldId: string) =>
    apiClient.get<{ field: Field }>(`/farms/${farmId}/fields/${fieldId}`, { token }),
  update: (token: string, farmId: string, fieldId: string, payload: Partial<FieldPayload>) =>
    apiClient.put<{ field: Field }>(`/farms/${farmId}/fields/${fieldId}`, payload, { token }),
  remove: (token: string, farmId: string, fieldId: string) =>
    apiClient.delete<void>(`/farms/${farmId}/fields/${fieldId}`, { token }),
  getForecast: (token: string, farmId: string, fieldId: string, days = 7) =>
    apiClient.get<{ snapshot: WeatherSnapshot }>(
      `/farms/${farmId}/fields/${fieldId}/weather/forecast?days=${days}`,
      { token }
    ),
  refreshForecast: (token: string, farmId: string, fieldId: string, days = 7) =>
    apiClient.post<{ snapshot: WeatherSnapshot }>(
      `/farms/${farmId}/fields/${fieldId}/weather/refresh?days=${days}`,
      undefined,
      { token }
    ),
};
