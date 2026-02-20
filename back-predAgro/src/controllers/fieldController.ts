import type { Request, Response } from 'express';
import * as fieldService from '../services/fieldService';

export async function listFields(req: Request, res: Response) {
  const fields = await fieldService.listByFarm(req.user!.id, String(req.params.farmId));

  res.status(200).json({
    fields,
  });
}

export async function createField(req: Request, res: Response) {
  const field = await fieldService.create(req.user!.id, String(req.params.farmId), req.body);

  res.status(201).json({
    field,
  });
}

export async function getField(req: Request, res: Response) {
  const field = await fieldService.getById(
    req.user!.id,
    String(req.params.farmId),
    String(req.params.fieldId)
  );

  res.status(200).json({
    field,
  });
}

export async function updateField(req: Request, res: Response) {
  const field = await fieldService.update(
    req.user!.id,
    String(req.params.farmId),
    String(req.params.fieldId),
    req.body
  );

  res.status(200).json({
    field,
  });
}

export async function deleteField(req: Request, res: Response) {
  await fieldService.remove(req.user!.id, String(req.params.farmId), String(req.params.fieldId));

  res.status(204).send();
}
