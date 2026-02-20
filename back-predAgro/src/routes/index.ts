import { Router } from 'express';
import { authRoutes } from './authRoutes';
import { agriculturalProfileRoutes } from './agriculturalProfileRoutes';
import { climateRoutes } from './climateRoutes';
import { agrometRoutes } from './agrometRoutes';
import { predictionRoutes } from './predictionRoutes';
import { dashboardRoutes } from './dashboardRoutes';
import { healthRoutes } from './healthRoutes';
import { authMiddleware } from '../middlewares/authMiddleware';

const apiRoutes = Router();

apiRoutes.use('/health', healthRoutes);
apiRoutes.use('/auth', authRoutes);

apiRoutes.use(authMiddleware);
apiRoutes.use('/agricultural-profile', agriculturalProfileRoutes);
apiRoutes.use('/climate', climateRoutes);
apiRoutes.use('/agromet', agrometRoutes);
apiRoutes.use('/predictions', predictionRoutes);
apiRoutes.use('/dashboard', dashboardRoutes);

export { apiRoutes };
