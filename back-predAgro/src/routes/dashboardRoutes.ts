import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as dashboardController from '../controllers/dashboardController';

const dashboardRoutes = Router();

dashboardRoutes.get('/overview', asyncHandler(dashboardController.getOverview));

export { dashboardRoutes };
