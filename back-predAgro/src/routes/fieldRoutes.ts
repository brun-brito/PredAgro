import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as fieldController from '../controllers/fieldController';

const fieldRoutes = Router();

fieldRoutes.get('/farms/:farmId/fields', asyncHandler(fieldController.listFields));
fieldRoutes.post('/farms/:farmId/fields', asyncHandler(fieldController.createField));
fieldRoutes.get('/farms/:farmId/fields/:fieldId', asyncHandler(fieldController.getField));
fieldRoutes.put('/farms/:farmId/fields/:fieldId', asyncHandler(fieldController.updateField));
fieldRoutes.delete('/farms/:farmId/fields/:fieldId', asyncHandler(fieldController.deleteField));

export { fieldRoutes };
