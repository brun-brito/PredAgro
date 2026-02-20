import { apiClient } from './httpClient';
import type { PredictionSummary } from '../types/domain';

export const predictionService = {
  getSummary: (token: string, farmId: string, fieldId: string) =>
    apiClient.get<{ summary: PredictionSummary }>(`/predictions/summary?farmId=${farmId}&fieldId=${fieldId}`, { token }),
};
