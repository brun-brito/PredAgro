const express = require('express');
const climateController = require('../controllers/climateController');
const { asyncHandler } = require('../utils/asyncHandler');

const climateRoutes = express.Router();

climateRoutes.get('/records', asyncHandler(climateController.listRecords));
climateRoutes.post('/records', asyncHandler(climateController.ingestRecord));

module.exports = { climateRoutes };
