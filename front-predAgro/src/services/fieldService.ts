import { apiClient } from './httpClient';
import { getCache, invalidateCache, setCache } from '../utils/cache';
import type { DrainageLevel, Field, FieldGeometry, SoilTexture, WeatherSnapshot } from '../types/domain';

export interface FieldPayload {
  name: string;
  geometry?: FieldGeometry | null;
  soilTexture?: SoilTexture;
  drainage?: DrainageLevel;
  irrigation?: boolean;
}

const fieldListKey = (token: string, farmId: string) => `fields:list:${token}:${farmId}`;
const fieldItemKey = (token: string, farmId: string, fieldId: string) => `fields:item:${token}:${farmId}:${fieldId}`;
const forecastKey = (token: string, farmId: string, fieldId: string, days: number) =>
  `fields:forecast:${token}:${farmId}:${fieldId}:${days}`;
const dashboardOverviewKey = (token: string) => `dashboard:overview:${token}`;
const FORECAST_TTL = 10 * 60 * 1000;

function updateFieldListCache(token: string, farmId: string, field: Field, mode: 'create' | 'update') {
  const cached = getCache<{ fields: Field[] }>(fieldListKey(token, farmId));
  if (!cached) {
    return;
  }

  const fields =
    mode === 'create'
      ? [field, ...cached.fields]
      : cached.fields.map((item) => (item.id === field.id ? field : item));
  setCache(fieldListKey(token, farmId), { fields });
}

export const fieldService = {
  getCachedListByFarm: (token: string, farmId: string) => getCache<{ fields: Field[] }>(fieldListKey(token, farmId)),
  getCachedById: (token: string, farmId: string, fieldId: string) =>
    getCache<{ field: Field }>(fieldItemKey(token, farmId, fieldId)),
  getCachedForecast: (token: string, farmId: string, fieldId: string, days = 16) =>
    getCache<{ snapshot: WeatherSnapshot }>(forecastKey(token, farmId, fieldId, days)),
  listByFarm: async (token: string, farmId: string) => {
    const response = await apiClient.get<{ fields: Field[] }>(`/farms/${farmId}/fields`, { token });
    setCache(fieldListKey(token, farmId), response);
    response.fields.forEach((field) => setCache(fieldItemKey(token, farmId, field.id), { field }));
    return response;
  },
  create: async (token: string, farmId: string, payload: FieldPayload) => {
    const response = await apiClient.post<{ field: Field }>(`/farms/${farmId}/fields`, payload, { token });
    setCache(fieldItemKey(token, farmId, response.field.id), { field: response.field });
    updateFieldListCache(token, farmId, response.field, 'create');
    invalidateCache(dashboardOverviewKey(token));
    return response;
  },
  getById: async (token: string, farmId: string, fieldId: string) => {
    const response = await apiClient.get<{ field: Field }>(`/farms/${farmId}/fields/${fieldId}`, { token });
    setCache(fieldItemKey(token, farmId, fieldId), response);
    return response;
  },
  update: async (token: string, farmId: string, fieldId: string, payload: Partial<FieldPayload>) => {
    const response = await apiClient.put<{ field: Field }>(`/farms/${farmId}/fields/${fieldId}`, payload, { token });
    setCache(fieldItemKey(token, farmId, fieldId), response);
    updateFieldListCache(token, farmId, response.field, 'update');
    invalidateCache(`fields:forecast:${token}:${farmId}:${fieldId}`);
    invalidateCache(dashboardOverviewKey(token));
    return response;
  },
  remove: async (token: string, farmId: string, fieldId: string) => {
    await apiClient.delete<void>(`/farms/${farmId}/fields/${fieldId}`, { token });
    invalidateCache(fieldItemKey(token, farmId, fieldId));
    invalidateCache(fieldListKey(token, farmId));
    invalidateCache(`fields:forecast:${token}:${farmId}:${fieldId}`);
    invalidateCache(`plans:list:${token}:${farmId}:${fieldId}`);
    invalidateCache(`plans:risk:${token}:${farmId}:${fieldId}`);
    invalidateCache(dashboardOverviewKey(token));
  },
  getForecast: async (token: string, farmId: string, fieldId: string, days = 16) => {
    const response = await apiClient.get<{ snapshot: WeatherSnapshot }>(
      `/farms/${farmId}/fields/${fieldId}/weather/forecast?days=${days}`,
      { token }
    );
    setCache(forecastKey(token, farmId, fieldId, days), response, FORECAST_TTL);
    return response;
  },
  refreshForecast: async (token: string, farmId: string, fieldId: string, days = 16) => {
    const response = await apiClient.post<{ snapshot: WeatherSnapshot }>(
      `/farms/${farmId}/fields/${fieldId}/weather/refresh?days=${days}`,
      undefined,
      { token }
    );
    setCache(forecastKey(token, farmId, fieldId, days), response, FORECAST_TTL);
    return response;
  },
};
