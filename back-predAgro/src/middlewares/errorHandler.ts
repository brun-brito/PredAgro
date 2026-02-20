import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { config } from '../config/env';
import { logger } from '../utils/logger';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  next(new AppError(`Rota ${req.method} ${req.originalUrl} não encontrada.`, 404));
}

export function errorHandler(error: unknown, req: Request, res: Response, next: NextFunction) {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = error instanceof AppError ? error.message : 'Erro interno no servidor.';

  logger.error(`Falha em ${req.method} ${req.originalUrl}`, {
    statusCode,
    message: getErrorMessage(error),
  });

  const payload: { message: string; details?: unknown } = {
    message,
  };

  if (config.nodeEnv !== 'production' && error instanceof AppError && error.details) {
    payload.details = error.details;
  }

  res.status(statusCode).json(payload);
}
