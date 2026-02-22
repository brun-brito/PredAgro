import { apiClient } from './httpClient';
import { getCache, setCache } from '../utils/cache';
import type { PlanRiskAssessment, PlantingPlan } from '../types/domain';

export interface PlanPayload {
  cropId: string;
  startDate: string;
  endDate: string;
}

const planListKey = (token: string, farmId: string, fieldId: string) =>
  `plans:list:${token}:${farmId}:${fieldId}`;
const planRiskKey = (token: string, farmId: string, fieldId: string, planId: string) =>
  `plans:risk:${token}:${farmId}:${fieldId}:${planId}`;

function updatePlanListCache(token: string, farmId: string, fieldId: string, plan: PlantingPlan) {
  const cached = getCache<{ plans: PlantingPlan[] }>(planListKey(token, farmId, fieldId));
  if (!cached) {
    return;
  }
  const plans = [plan, ...cached.plans];
  setCache(planListKey(token, farmId, fieldId), { plans });
}

export const planService = {
  getCachedListByField: (token: string, farmId: string, fieldId: string) =>
    getCache<{ plans: PlantingPlan[] }>(planListKey(token, farmId, fieldId)),
  getCachedRisk: (token: string, farmId: string, fieldId: string, planId: string) =>
    getCache<{ assessment: PlanRiskAssessment }>(planRiskKey(token, farmId, fieldId, planId)),
  listByField: async (token: string, farmId: string, fieldId: string) => {
    const response = await apiClient.get<{ plans: PlantingPlan[] }>(
      `/farms/${farmId}/fields/${fieldId}/plans`,
      { token }
    );
    setCache(planListKey(token, farmId, fieldId), response);
    return response;
  },
  create: async (token: string, farmId: string, fieldId: string, payload: PlanPayload) => {
    const response = await apiClient.post<{ plan: PlantingPlan }>(
      `/farms/${farmId}/fields/${fieldId}/plans`,
      payload,
      { token }
    );
    updatePlanListCache(token, farmId, fieldId, response.plan);
    return response;
  },
  getRisk: async (token: string, farmId: string, fieldId: string, planId: string) => {
    const response = await apiClient.get<{ assessment: PlanRiskAssessment }>(
      `/farms/${farmId}/fields/${fieldId}/plans/${planId}/risk`,
      { token }
    );
    setCache(planRiskKey(token, farmId, fieldId, planId), response);
    return response;
  },
};
