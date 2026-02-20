import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as weatherController from '../controllers/weatherController';

const weatherRoutes = Router();

weatherRoutes.get('/farms/:farmId/fields/:fieldId/weather/forecast', asyncHandler(weatherController.getForecast));
weatherRoutes.post('/farms/:farmId/fields/:fieldId/weather/refresh', asyncHandler(weatherController.refreshForecast));
weatherRoutes.get('/farms/:farmId/fields/:fieldId/weather/snapshots', asyncHandler(weatherController.listSnapshots));

export { weatherRoutes };
