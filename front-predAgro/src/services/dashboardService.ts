import { apiClient } from './httpClient';
import { getCache, invalidateCache, setCache } from '../utils/cache';
import type { DashboardOverview } from '../types/domain';

const overviewKey = (token: string) => `dashboard:overview:${token}`;
const OVERVIEW_TTL = 2 * 60 * 1000;

export const dashboardService = {
  getCachedOverview: (token: string) => getCache<DashboardOverview>(overviewKey(token)),
  getOverview: async (token: string, options?: { skipCache?: boolean }) => {
    if (!options?.skipCache) {
      const cached = getCache<DashboardOverview>(overviewKey(token));
      if (cached) {
        return cached;
      }
    }

    const response = await apiClient.get<DashboardOverview>('/dashboard/overview', { token });
    setCache(overviewKey(token), response, OVERVIEW_TTL);
    return response;
  },
  invalidateOverview: (token: string) => {
    invalidateCache(overviewKey(token));
  },
};
