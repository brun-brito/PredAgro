const { AppError } = require('../utils/AppError');
const { config } = require('../config/env');
const { logger } = require('../utils/logger');

function notFoundHandler(req, res, next) {
  next(new AppError(`Rota ${req.method} ${req.originalUrl} não encontrada.`, 404));
}

function errorHandler(error, req, res, next) {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = error instanceof AppError ? error.message : 'Erro interno no servidor.';

  logger.error(`Falha em ${req.method} ${req.originalUrl}`, {
    statusCode,
    message: error.message,
  });

  const payload = {
    message,
  };

  if (config.nodeEnv !== 'production' && error.details) {
    payload.details = error.details;
  }

  res.status(statusCode).json(payload);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
