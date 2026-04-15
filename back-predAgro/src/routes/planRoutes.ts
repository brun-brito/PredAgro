import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as planController from '../controllers/planController';

const planRoutes = Router();

planRoutes.get('/farms/:farmId/fields/:fieldId/plans', asyncHandler(planController.listPlans));
planRoutes.get('/farms/:farmId/fields/:fieldId/plans/estimate', asyncHandler(planController.estimatePlanCycle));
planRoutes.post('/farms/:farmId/fields/:fieldId/plans', asyncHandler(planController.createPlan));
planRoutes.get('/farms/:farmId/fields/:fieldId/plans/:planId', asyncHandler(planController.getPlan));
planRoutes.delete('/farms/:farmId/fields/:fieldId/plans/:planId', asyncHandler(planController.deletePlan));
planRoutes.get('/farms/:farmId/fields/:fieldId/plans/:planId/risk', asyncHandler(planController.getPlanRisk));

export { planRoutes };
