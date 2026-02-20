import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    logger.info(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`);
  });

  next();
}
