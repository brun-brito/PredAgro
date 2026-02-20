import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as agrometController from '../controllers/agrometController';

const agrometRoutes = Router();

agrometRoutes.get('/sources', asyncHandler(agrometController.listSources));
agrometRoutes.get('/latest', asyncHandler(agrometController.getLatest));

export { agrometRoutes };
