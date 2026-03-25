import express from 'express';
import cors, { type CorsOptions } from 'cors';
import { AppError } from './utils/AppError';
import { config } from './config/env';
import { apiRoutes } from './routes';
import { requestLogger } from './middlewares/requestLogger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

const app = express();

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesAllowedOrigin(origin: string, allowedOrigin: string) {
  if (allowedOrigin === origin) {
    return true;
  }

  if (!allowedOrigin.includes('*')) {
    return false;
  }

  const wildcardPattern = allowedOrigin
    .split('*')
    .map((part) => escapeRegex(part))
    .join('[^/]+');

  return new RegExp(`^${wildcardPattern}$`).test(origin);
}

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    const normalizedOrigin = origin?.trim().replace(/\/+$/, '');

    if (
      !normalizedOrigin ||
      config.allowAnyCorsOrigin ||
      config.corsOrigins.some((allowedOrigin) => matchesAllowedOrigin(normalizedOrigin, allowedOrigin))
    ) {
      callback(null, true);
      return;
    }

    callback(new AppError(`Origem ${normalizedOrigin} não permitida por CORS.`, 403));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

app.use('/api', apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
