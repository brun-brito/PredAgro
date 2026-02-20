import type { Request, Response } from 'express';
import * as farmService from '../services/farmService';

export async function listFarms(req: Request, res: Response) {
  const farms = await farmService.listByUserId(req.user!.id);

  res.status(200).json({
    farms,
  });
}

export async function createFarm(req: Request, res: Response) {
  const farm = await farmService.create(req.user!.id, req.body);

  res.status(201).json({
    farm,
  });
}

export async function getFarm(req: Request, res: Response) {
  const farm = await farmService.getById(req.user!.id, String(req.params.farmId));

  res.status(200).json({
    farm,
  });
}

export async function updateFarm(req: Request, res: Response) {
  const farm = await farmService.update(req.user!.id, String(req.params.farmId), req.body);

  res.status(200).json({
    farm,
  });
}

export async function deleteFarm(req: Request, res: Response) {
  await farmService.remove(req.user!.id, String(req.params.farmId));

  res.status(204).send();
}
