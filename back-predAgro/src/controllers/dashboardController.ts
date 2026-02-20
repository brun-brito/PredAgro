import type { Request, Response } from 'express';
import * as dashboardService from '../services/dashboardService';

export async function getOverview(req: Request, res: Response) {
  const overview = await dashboardService.getOverview(req.user!.id);

  res.status(200).json(overview);
}
