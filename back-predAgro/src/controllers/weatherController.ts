import type { Request, Response } from 'express';
import * as weatherService from '../services/weatherService';

export async function getForecast(req: Request, res: Response) {
  const days = req.query.days ? Number(req.query.days) : undefined;

  const snapshot = await weatherService.getForecast(req.user!.id, String(req.params.farmId), String(req.params.fieldId), {
    days,
  });

  res.status(200).json({
    snapshot,
  });
}

export async function refreshForecast(req: Request, res: Response) {
  const days = req.query.days ? Number(req.query.days) : undefined;

  const snapshot = await weatherService.getForecast(req.user!.id, String(req.params.farmId), String(req.params.fieldId), {
    days,
    force: true,
  });

  res.status(200).json({
    snapshot,
  });
}

export async function listSnapshots(req: Request, res: Response) {
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const snapshots = await weatherService.listSnapshots(
    req.user!.id,
    String(req.params.farmId),
    String(req.params.fieldId),
    limit
  );

  res.status(200).json({
    snapshots,
  });
}
