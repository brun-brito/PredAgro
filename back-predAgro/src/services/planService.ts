import { AppError } from '../utils/AppError';
import { requireString } from '../utils/validators';
import * as planRepository from '../repositories/planRepository';
import * as fieldService from './fieldService';
import { getCropById } from './cropService';
import type { PlantingPlan } from '../types/domain';

const MAX_PLAN_DAYS = 180;
const DAY_MS = 24 * 60 * 60 * 1000;

interface PlanPayload {
  cropId: string;
  startDate: string;
  endDate: string;
}

function parseDate(value: string, fieldName: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(`Campo ${fieldName} deve estar no formato YYYY-MM-DD.`, 400);
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (Number.isNaN(date.getTime())) {
    throw new AppError(`Campo ${fieldName} inválido.`, 400);
  }

  return date;
}

function diffDaysInclusive(start: Date, end: Date) {
  return Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
}

function todayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function listByField(userId: string, farmId: string, fieldId: string): Promise<PlantingPlan[]> {
  await fieldService.getById(userId, farmId, fieldId);
  return planRepository.listByFieldId(userId, farmId, fieldId);
}

export async function getById(
  userId: string,
  farmId: string,
  fieldId: string,
  planId: string
): Promise<PlantingPlan> {
  const plan = await planRepository.findById(userId, farmId, fieldId, planId);

  if (!plan) {
    throw new AppError('Plano de safra não encontrado.', 404);
  }

  return plan;
}

export async function create(
  userId: string,
  farmId: string,
  fieldId: string,
  payload: PlanPayload
): Promise<PlantingPlan> {
  const field = await fieldService.getById(userId, farmId, fieldId);

  const cropId = requireString(payload.cropId, 'cropId', 2);
  const crop = getCropById(cropId);

  if (!crop) {
    throw new AppError('Cultura informada não é suportada.', 400);
  }

  const startDateRaw = requireString(payload.startDate, 'startDate', 10);
  const endDateRaw = requireString(payload.endDate, 'endDate', 10);

  const startDate = parseDate(startDateRaw, 'startDate');
  const endDate = parseDate(endDateRaw, 'endDate');
  if (endDate.getTime() < startDate.getTime()) {
    throw new AppError('A data final deve ser igual ou posterior à data inicial.', 400);
  }

  const totalDays = diffDaysInclusive(startDate, endDate);
  const latestAllowedDate = new Date(todayUtc().getTime() + (MAX_PLAN_DAYS - 1) * DAY_MS);

  if (totalDays > MAX_PLAN_DAYS) {
    throw new AppError(`O planejamento deve ter no máximo ${MAX_PLAN_DAYS} dias.`, 400);
  }

  if (startDate.getTime() > latestAllowedDate.getTime() || endDate.getTime() > latestAllowedDate.getTime()) {
    throw new AppError('O intervalo selecionado deve estar dentro do período de planejamento disponível.', 400);
  }

  if (startDate.getTime() < todayUtc().getTime()) {
    throw new AppError('A data inicial deve ser hoje ou uma data futura.', 400);
  }

  const now = new Date().toISOString();

  return planRepository.create(userId, farmId, fieldId, {
    userId,
    farmId,
    fieldId,
    cropId,
    startDate: startDateRaw,
    endDate: endDateRaw,
    areaHa: field.areaHa,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateRiskCache(
  userId: string,
  farmId: string,
  fieldId: string,
  planId: string,
  riskCache: PlantingPlan['riskCache']
) {
  await planRepository.update(userId, farmId, fieldId, planId, {
    riskCache,
    updatedAt: new Date().toISOString(),
  });
}
