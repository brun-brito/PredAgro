import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as agriculturalProfileController from '../controllers/agriculturalProfileController';

const agriculturalProfileRoutes = Router();

agriculturalProfileRoutes.get('/me', asyncHandler(agriculturalProfileController.getMyProfile));
agriculturalProfileRoutes.put('/me', asyncHandler(agriculturalProfileController.updateMyProfile));

export { agriculturalProfileRoutes };
