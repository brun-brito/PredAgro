import type { Request, Response } from 'express';
import * as cropService from '../services/cropService';

export async function listCrops(req: Request, res: Response) {
  const crops = cropService.listCrops();

  res.status(200).json({
    crops,
  });
}
