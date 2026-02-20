import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as climateController from '../controllers/climateController';

const climateRoutes = Router();

climateRoutes.get('/records', asyncHandler(climateController.listRecords));
climateRoutes.post('/records', asyncHandler(climateController.ingestRecord));

export { climateRoutes };
