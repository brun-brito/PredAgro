import type { Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import * as weatherService from '../services/weatherService';
import { evaluateRisk } from '../services/predictionService';

export async function getSummary(req: Request, res: Response) {
  const farmId = typeof req.query.farmId === 'string' ? req.query.farmId : undefined;
  const fieldId = typeof req.query.fieldId === 'string' ? req.query.fieldId : undefined;

  if (!farmId || !fieldId) {
    throw new AppError('Informe os campos farmId e fieldId.', 400);
  }

  const snapshot = await weatherService.getForecast(req.user!.id, farmId, fieldId);
  const risk = evaluateRisk(snapshot.days);

  res.status(200).json({
    summary: {
      fieldId,
      ...risk,
      generatedAt: new Date().toISOString(),
    },
  });
}
