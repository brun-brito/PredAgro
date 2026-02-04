const express = require('express');
const agrometController = require('../controllers/agrometController');
const { asyncHandler } = require('../utils/asyncHandler');

const agrometRoutes = express.Router();

agrometRoutes.get('/sources', asyncHandler(agrometController.listSources));
agrometRoutes.get('/latest', asyncHandler(agrometController.getLatest));

module.exports = { agrometRoutes };
