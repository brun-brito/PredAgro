import type { Request, Response } from 'express';
import * as authService from '../services/authService';

export async function register(req: Request, res: Response) {
  const response = await authService.register(req.body);
  res.status(201).json(response);
}

export async function login(req: Request, res: Response) {
  const response = await authService.login(req.body);
  res.status(200).json(response);
}
