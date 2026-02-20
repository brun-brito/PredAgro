import type { Request, Response } from 'express';
import * as climateService from '../services/climateService';

export async function ingestRecord(req: Request, res: Response) {
  const record = await climateService.ingestRecord(req.user!.id, req.body);

  res.status(201).json({
    record,
  });
}

export async function listRecords(req: Request, res: Response) {
  const records = await climateService.listByUserId(req.user!.id);

  res.status(200).json({
    records,
  });
}
