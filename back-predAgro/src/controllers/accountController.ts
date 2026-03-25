import type { Request, Response } from 'express';
import * as accountService from '../services/accountService';

export async function getProfile(req: Request, res: Response) {
  const response = await accountService.getProfile(req.user!.id);
  res.status(200).json(response);
}

export async function updateProfile(req: Request, res: Response) {
  const response = await accountService.updateProfile(req.user!.id, req.body);
  res.status(200).json(response);
}
