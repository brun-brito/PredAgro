import type { Request, Response } from 'express';

export async function getHealth(req: Request, res: Response) {
  res.status(200).json({
    status: 'ok',
    service: 'back-predAgro',
    timestamp: new Date().toISOString(),
  });
}
