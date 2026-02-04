import { apiClient } from './httpClient';
import type { DashboardOverview } from '../types/domain';

export const dashboardService = {
  getOverview: (token: string) => apiClient.get<DashboardOverview>('/dashboard/overview', { token }),
};
