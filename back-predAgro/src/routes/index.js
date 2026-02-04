const express = require('express');
const { authRoutes } = require('./authRoutes');
const { agriculturalProfileRoutes } = require('./agriculturalProfileRoutes');
const { climateRoutes } = require('./climateRoutes');
const { agrometRoutes } = require('./agrometRoutes');
const { predictionRoutes } = require('./predictionRoutes');
const { dashboardRoutes } = require('./dashboardRoutes');
const { healthRoutes } = require('./healthRoutes');
const { authMiddleware } = require('../middlewares/authMiddleware');

const apiRoutes = express.Router();

apiRoutes.use('/health', healthRoutes);
apiRoutes.use('/auth', authRoutes);

apiRoutes.use(authMiddleware);
apiRoutes.use('/agricultural-profile', agriculturalProfileRoutes);
apiRoutes.use('/climate', climateRoutes);
apiRoutes.use('/agromet', agrometRoutes);
apiRoutes.use('/predictions', predictionRoutes);
apiRoutes.use('/dashboard', dashboardRoutes);

module.exports = { apiRoutes };
