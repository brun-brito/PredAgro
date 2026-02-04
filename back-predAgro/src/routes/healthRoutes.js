const express = require('express');
const healthController = require('../controllers/healthController');
const { asyncHandler } = require('../utils/asyncHandler');

const healthRoutes = express.Router();

healthRoutes.get('/', asyncHandler(healthController.getHealth));

module.exports = { healthRoutes };
