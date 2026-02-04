const express = require('express');
const predictionController = require('../controllers/predictionController');
const { asyncHandler } = require('../utils/asyncHandler');

const predictionRoutes = express.Router();

predictionRoutes.get('/summary', asyncHandler(predictionController.getSummary));

module.exports = { predictionRoutes };
