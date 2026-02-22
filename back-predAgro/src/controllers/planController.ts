import type { Request, Response } from 'express';
import * as planService from '../services/planService';
import * as planRiskService from '../services/planRiskService';

export async function listPlans(req: Request, res: Response) {
  const plans = await planService.listByField(
    req.user!.id,
    String(req.params.farmId),
    String(req.params.fieldId)
  );

  res.status(200).json({
    plans,
  });
}

export async function getPlan(req: Request, res: Response) {
  const plan = await planService.getById(
    req.user!.id,
    String(req.params.farmId),
    String(req.params.fieldId),
    String(req.params.planId)
  );

  res.status(200).json({
    plan,
  });
}

export async function createPlan(req: Request, res: Response) {
  const plan = await planService.create(
    req.user!.id,
    String(req.params.farmId),
    String(req.params.fieldId),
    req.body
  );

  res.status(201).json({
    plan,
  });
}

export async function getPlanRisk(req: Request, res: Response) {
  const assessment = await planRiskService.getPlanRisk(
    req.user!.id,
    String(req.params.farmId),
    String(req.params.fieldId),
    String(req.params.planId)
  );

  res.status(200).json({
    assessment,
  });
}
