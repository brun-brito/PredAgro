import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as farmController from '../controllers/farmController';

const farmRoutes = Router();

farmRoutes.get('/', asyncHandler(farmController.listFarms));
farmRoutes.post('/', asyncHandler(farmController.createFarm));
farmRoutes.get('/:farmId', asyncHandler(farmController.getFarm));
farmRoutes.put('/:farmId', asyncHandler(farmController.updateFarm));
farmRoutes.delete('/:farmId', asyncHandler(farmController.deleteFarm));

export { farmRoutes };
