import type { Request, Response } from 'express';
import * as agriculturalProfileService from '../services/agriculturalProfileService';
import * as climateService from '../services/climateService';
import * as agrometService from '../services/agrometService';
import { buildSummary } from '../services/predictionService';

export async function getSummary(req: Request, res: Response) {
  const profile = await agriculturalProfileService.getByUserId(req.user!.id);

  const latestClimate =
    (await climateService.findLatestByUserId(req.user!.id)) ??
    agrometService.getLatestSnapshot(profile?.state ?? 'Triângulo Mineiro');

  const summary = buildSummary(profile, latestClimate);

  res.status(200).json({
    summary,
  });
}
