import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as accountController from '../controllers/accountController';

const accountRoutes = Router();

accountRoutes.get('/me', asyncHandler(accountController.getProfile));
accountRoutes.put('/me', asyncHandler(accountController.updateProfile));

export { accountRoutes };
