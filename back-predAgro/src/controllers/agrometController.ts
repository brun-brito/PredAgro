import type { Request, Response } from 'express';
import * as agrometService from '../services/agrometService';

export async function listSources(req: Request, res: Response) {
  const sources = agrometService.listSources();

  res.status(200).json({
    sources,
  });
}
