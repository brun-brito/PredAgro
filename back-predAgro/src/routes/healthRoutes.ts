import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as healthController from '../controllers/healthController';

const healthRoutes = Router();

healthRoutes.get('/', asyncHandler(healthController.getHealth));

export { healthRoutes };
