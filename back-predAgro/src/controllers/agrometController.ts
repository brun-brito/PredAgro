import type { Request, Response } from 'express';
import * as agrometService from '../services/agrometService';

export async function listSources(req: Request, res: Response) {
  const sources = agrometService.listSources();

  res.status(200).json({
    sources,
  });
}

export async function getLatest(req: Request, res: Response) {
  const region = req.query.region as string | undefined;
  const snapshot = agrometService.getLatestSnapshot(region);

  res.status(200).json({
    snapshot,
  });
}
