import { AppError } from '../utils/AppError';
import { requireString } from '../utils/validators';
import * as planRepository from '../repositories/planRepository';
import * as fieldService from './fieldService';
import { getCropById, isActiveCropId } from './cropService';
import * as weatherService from './weatherService';
import * as historicalWeatherService from './historicalWeatherService';
import type { CropProfile, PlanCycleEstimate, PlantingPlan, WeatherDay } from '../types/domain';

const MAX_PLAN_DAYS = 180;
const MAX_START_LEAD_DAYS = 365;
const MAX_FORECAST_DAYS = 16;
const DAY_MS = 24 * 60 * 60 * 1000;

interface PlanPayload {
  cropId: string;
  startDate: string;
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

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function todayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getConfidenceFromMode(mode: PlanCycleEstimate['dataMode']): PlanCycleEstimate['confidence'] {
  if (mode === 'forecast') {
    return 'high';
  }

  if (mode === 'mixed') {
    return 'medium';
  }

  return 'low';
}

function validateCrop(payload: PlanPayload): CropProfile {
  const cropId = requireString(payload.cropId, 'cropId', 2);
  const crop = isActiveCropId(cropId) ? getCropById(cropId) : null;

  if (!crop) {
    throw new AppError('O planejamento está disponível apenas para milho 1ª safra.', 400);
  }

  if (!crop.cycleDays || !crop.cycleModel) {
    throw new AppError('A cultura selecionada não possui um modelo de ciclo configurado.', 400);
  }

  return crop;
}

function validateStartDate(startDate: Date) {
  const today = todayUtc();

  if (startDate.getTime() < today.getTime()) {
    throw new AppError('A data inicial deve ser hoje ou uma data futura.', 400);
  }

  const latestAllowedStart = addDays(today, MAX_START_LEAD_DAYS - 1);
  if (startDate.getTime() > latestAllowedStart.getTime()) {
    throw new AppError(`A data inicial deve estar dentro dos próximos ${MAX_START_LEAD_DAYS} dias.`, 400);
  }
}

function mergeProjectedWeatherDays(
  startDate: Date,
  totalDays: number,
  forecastDays: WeatherDay[],
  historicalDays: WeatherDay[]
) {
  const forecastByDate = new Map(forecastDays.map((day) => [day.date, day]));
  const sources: Array<'forecast' | 'historical'> = [];

  const days = Array.from({ length: totalDays }, (_, index) => {
    const currentDate = formatDate(addDays(startDate, index));
    const forecastDay = forecastByDate.get(currentDate);
    const historicalDay = historicalDays[index];

    if (forecastDay) {
      sources.push('forecast');
      return forecastDay;
    }

    if (!historicalDay) {
      throw new AppError('Histórico climático insuficiente para estimar o ciclo do milho.', 502);
    }

    sources.push('historical');

    return {
      ...historicalDay,
      date: currentDate,
    };
  });

  return {
    days,
    sources,
  };
}

export async function estimateCycle(
  userId: string,
  farmId: string,
  fieldId: string,
  payload: PlanPayload
): Promise<PlanCycleEstimate> {
  const field = await fieldService.getById(userId, farmId, fieldId);

  if (field.areaHa === null || field.centroidLat === null || field.centroidLon === null) {
    throw new AppError('Talhão sem delimitação. Defina o polígono antes de gerar o planejamento.', 400);
  }

  const crop = validateCrop(payload);
  const startDateRaw = requireString(payload.startDate, 'startDate', 10);
  const startDate = parseDate(startDateRaw, 'startDate');
  validateStartDate(startDate);

  const cycleModel = crop.cycleModel!;
  const maxProjectionDays = Math.min(cycleModel.maxCycleDays, MAX_PLAN_DAYS);
  const targetDegreeDays = Number(
    ((crop.cycleDays ?? maxProjectionDays) * (cycleModel.referenceTempC - cycleModel.baseTempC)).toFixed(1)
  );

  const [forecastSnapshot, historicalDays] = await Promise.all([
    weatherService.getForecast(userId, farmId, fieldId, { days: MAX_FORECAST_DAYS }),
    historicalWeatherService.getHistoricalNormals(field.centroidLat, field.centroidLon, startDate, maxProjectionDays),
  ]);

  const projected = mergeProjectedWeatherDays(
    startDate,
    maxProjectionDays,
    forecastSnapshot.days,
    historicalDays
  );

  let cumulativeDegreeDays = 0;
  let estimatedCycleDays = maxProjectionDays;

  for (let index = 0; index < projected.days.length; index += 1) {
    const day = projected.days[index];
    const tempAvg = average([day.temperatureMin, day.temperatureMax]);
    const dailyDegreeDays = Math.max(0, tempAvg - cycleModel.baseTempC);
    cumulativeDegreeDays += dailyDegreeDays;

    const elapsedDays = index + 1;
    if (elapsedDays < cycleModel.minCycleDays) {
      continue;
    }

    if (cumulativeDegreeDays >= targetDegreeDays) {
      estimatedCycleDays = elapsedDays;
      break;
    }
  }

  const endDate = addDays(startDate, estimatedCycleDays - 1);
  const cycleSources = projected.sources.slice(0, estimatedCycleDays);
  const forecastDaysUsed = cycleSources.filter((source) => source === 'forecast').length;
  const historicalDaysUsed = cycleSources.length - forecastDaysUsed;
  const dataMode: PlanCycleEstimate['dataMode'] =
    forecastDaysUsed >= estimatedCycleDays
      ? 'forecast'
      : forecastDaysUsed === 0
        ? 'historical'
        : 'mixed';

  const notes = [
    `Data final estimada por soma térmica simplificada, usando temperatura-base de ${cycleModel.baseTempC.toFixed(
      0
    )} °C para o milho 1ª safra.`,
    `O alvo térmico do ciclo foi definido em ${targetDegreeDays.toFixed(
      0
    )} graus-dia, derivado do ciclo de ${crop.cycleDays} dias do Grupo II do ZARC e da temperatura média de referência de ${cycleModel.referenceTempC.toFixed(
      1
    )} °C.`,
    forecastDaysUsed > 0
      ? `A estimativa usa ${forecastDaysUsed} dias de previsão direta do Open-Meteo e ${historicalDaysUsed} dias de climatologia histórica para completar o ciclo.`
      : 'A estimativa usa climatologia histórica para todo o ciclo projetado.',
  ];

  if (estimatedCycleDays === maxProjectionDays && cumulativeDegreeDays < targetDegreeDays) {
    notes.push(
      `O ciclo projetado atingiu o limite operacional de ${maxProjectionDays} dias sem completar o alvo térmico, mantendo a data final no limite superior configurado para a cultura.`
    );
  }

  return {
    method: 'thermal-time',
    startDate: startDateRaw,
    endDate: formatDate(endDate),
    estimatedCycleDays,
    baseTempC: cycleModel.baseTempC,
    referenceTempC: cycleModel.referenceTempC,
    targetDegreeDays,
    dataMode,
    confidence: getConfidenceFromMode(dataMode),
    forecastDaysUsed,
    historicalDaysUsed,
    notes,
  };
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

  if (field.areaHa === null) {
    throw new AppError('Talhão sem delimitação. Defina o polígono antes de criar um planejamento.', 400);
  }

  const crop = validateCrop(payload);
  const cycleEstimate = await estimateCycle(userId, farmId, fieldId, payload);
  const totalDays = diffDaysInclusive(
    parseDate(cycleEstimate.startDate, 'startDate'),
    parseDate(cycleEstimate.endDate, 'endDate')
  );
  if (totalDays > MAX_PLAN_DAYS) {
    throw new AppError(`O planejamento deve ter no máximo ${MAX_PLAN_DAYS} dias.`, 400);
  }

  const now = new Date().toISOString();

  return planRepository.create(userId, farmId, fieldId, {
    userId,
    farmId,
    fieldId,
    cropId: crop.id,
    startDate: cycleEstimate.startDate,
    endDate: cycleEstimate.endDate,
    cycleEstimate,
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

export async function remove(userId: string, farmId: string, fieldId: string, planId: string) {
  await getById(userId, farmId, fieldId, planId);
  await planRepository.remove(userId, farmId, fieldId, planId);
}
