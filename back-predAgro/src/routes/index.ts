import { Router } from 'express';
import { authRoutes } from './authRoutes';
import { farmRoutes } from './farmRoutes';
import { fieldRoutes } from './fieldRoutes';
import { weatherRoutes } from './weatherRoutes';
import { agrometRoutes } from './agrometRoutes';
import { predictionRoutes } from './predictionRoutes';
import { dashboardRoutes } from './dashboardRoutes';
import { healthRoutes } from './healthRoutes';
import { authMiddleware } from '../middlewares/authMiddleware';

const apiRoutes = Router();

apiRoutes.use('/health', healthRoutes);
apiRoutes.use('/auth', authRoutes);

apiRoutes.use(authMiddleware);
apiRoutes.use('/farms', farmRoutes);
apiRoutes.use('/agromet', agrometRoutes);
apiRoutes.use('/predictions', predictionRoutes);
apiRoutes.use('/dashboard', dashboardRoutes);
apiRoutes.use('/', fieldRoutes);
apiRoutes.use('/', weatherRoutes);

export { apiRoutes };
