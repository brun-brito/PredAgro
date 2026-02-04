const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { asyncHandler } = require('../utils/asyncHandler');

const dashboardRoutes = express.Router();

dashboardRoutes.get('/overview', asyncHandler(dashboardController.getOverview));

module.exports = { dashboardRoutes };
