import { apiClient } from './httpClient';
import { getCache, setCache } from '../utils/cache';
import type { CropProfile } from '../types/domain';

const cropListKey = (token: string) => `crops:list:${token}`;

export const cropService = {
  getCachedList: (token: string) => getCache<{ crops: CropProfile[] }>(cropListKey(token)),
  list: async (token: string) => {
    const response = await apiClient.get<{ crops: CropProfile[] }>('/crops', { token });
    setCache(cropListKey(token), response);
    return response;
  },
};
