import type { Request, Response } from 'express';
import * as agriculturalProfileService from '../services/agriculturalProfileService';

export async function getMyProfile(req: Request, res: Response) {
  const profile = await agriculturalProfileService.getByUserId(req.user!.id);

  res.status(200).json({
    profile,
  });
}

export async function updateMyProfile(req: Request, res: Response) {
  const profile = await agriculturalProfileService.updateByUserId(req.user!.id, req.body);

  res.status(200).json({
    profile,
  });
}
