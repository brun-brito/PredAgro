import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as predictionController from '../controllers/predictionController';

const predictionRoutes = Router();

predictionRoutes.get('/summary', asyncHandler(predictionController.getSummary));

export { predictionRoutes };
