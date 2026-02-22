import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as cropController from '../controllers/cropController';

const cropRoutes = Router();

cropRoutes.get('/crops', asyncHandler(cropController.listCrops));

export { cropRoutes };
