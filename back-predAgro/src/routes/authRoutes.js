const express = require('express');
const authController = require('../controllers/authController');
const { asyncHandler } = require('../utils/asyncHandler');

const authRoutes = express.Router();

authRoutes.post('/register', asyncHandler(authController.register));
authRoutes.post('/login', asyncHandler(authController.login));

module.exports = { authRoutes };
