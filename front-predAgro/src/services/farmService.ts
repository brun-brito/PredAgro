import { apiClient } from './httpClient';
import { getCache, invalidateCache, setCache } from '../utils/cache';
import type { Farm } from '../types/domain';

export interface FarmPayload {
  name: string;
  city?: string;
  state?: string;
}

const farmListKey = (token: string) => `farms:list:${token}`;
const farmItemKey = (token: string, farmId: string) => `farms:item:${token}:${farmId}`;
const dashboardOverviewKey = (token: string) => `dashboard:overview:${token}`;

function updateFarmListCache(token: string, farm: Farm, mode: 'create' | 'update') {
  const cached = getCache<{ farms: Farm[] }>(farmListKey(token));
  if (!cached) {
    return;
  }

  const farms = mode === 'create' ? [farm, ...cached.farms] : cached.farms.map((item) => (item.id === farm.id ? farm : item));
  setCache(farmListKey(token), { farms });
}

export const farmService = {
  getCachedList: (token: string) => getCache<{ farms: Farm[] }>(farmListKey(token)),
  getCachedById: (token: string, farmId: string) => getCache<{ farm: Farm }>(farmItemKey(token, farmId)),
  list: async (token: string) => {
    const response = await apiClient.get<{ farms: Farm[] }>('/farms', { token });
    setCache(farmListKey(token), response);
    response.farms.forEach((farm) => setCache(farmItemKey(token, farm.id), { farm }));
    return response;
  },
  create: async (token: string, payload: FarmPayload) => {
    const response = await apiClient.post<{ farm: Farm }>('/farms', payload, { token });
    setCache(farmItemKey(token, response.farm.id), { farm: response.farm });
    updateFarmListCache(token, response.farm, 'create');
    invalidateCache(dashboardOverviewKey(token));
    return response;
  },
  getById: async (token: string, farmId: string) => {
    const response = await apiClient.get<{ farm: Farm }>(`/farms/${farmId}`, { token });
    setCache(farmItemKey(token, farmId), response);
    return response;
  },
  update: async (token: string, farmId: string, payload: Partial<FarmPayload>) => {
    const response = await apiClient.put<{ farm: Farm }>(`/farms/${farmId}`, payload, { token });
    setCache(farmItemKey(token, farmId), response);
    updateFarmListCache(token, response.farm, 'update');
    invalidateCache(dashboardOverviewKey(token));
    return response;
  },
  remove: async (token: string, farmId: string) => {
    await apiClient.delete<void>(`/farms/${farmId}`, { token });
    invalidateCache(farmItemKey(token, farmId));
    invalidateCache(farmListKey(token));
    invalidateCache(`fields:list:${token}:${farmId}`);
    invalidateCache(`fields:item:${token}:${farmId}:`);
    invalidateCache(`fields:forecast:${token}:${farmId}:`);
    invalidateCache(`plans:list:${token}:${farmId}:`);
    invalidateCache(`plans:risk:${token}:${farmId}:`);
    invalidateCache(dashboardOverviewKey(token));
  },
};
