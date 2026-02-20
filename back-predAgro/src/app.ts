import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { apiRoutes } from './routes';
import { requestLogger } from './middlewares/requestLogger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

app.use('/api', apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
