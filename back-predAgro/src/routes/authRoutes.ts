import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as authController from '../controllers/authController';

const authRoutes = Router();

authRoutes.post('/register', asyncHandler(authController.register));
authRoutes.post('/login', asyncHandler(authController.login));
authRoutes.post('/google', asyncHandler(authController.authenticateWithGoogle));
authRoutes.post('/refresh', asyncHandler(authController.refreshSession));
authRoutes.post('/forgot-password', asyncHandler(authController.forgotPassword));

export { authRoutes };
