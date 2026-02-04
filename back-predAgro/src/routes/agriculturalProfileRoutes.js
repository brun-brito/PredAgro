const express = require('express');
const agriculturalProfileController = require('../controllers/agriculturalProfileController');
const { asyncHandler } = require('../utils/asyncHandler');

const agriculturalProfileRoutes = express.Router();

agriculturalProfileRoutes.get('/me', asyncHandler(agriculturalProfileController.getMyProfile));
agriculturalProfileRoutes.put('/me', asyncHandler(agriculturalProfileController.updateMyProfile));

module.exports = { agriculturalProfileRoutes };
