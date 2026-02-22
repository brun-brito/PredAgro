import { AppError } from '../utils/AppError';
import type {
  CropProfile,
  CropStageRule,
  Field,
  PlanRiskAssessment,
  RiskCategoryId,
  RiskCategoryResult,
  RiskLevel,
  WeatherDay,
} from '../types/domain';
import * as cropService from './cropService';
import * as planService from './planService';
import * as weatherService from './weatherService';
import * as fieldService from './fieldService';
import * as historicalWeatherService from './historicalWeatherService';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_FORECAST_DAYS = 16;
const MAX_PLAN_DAYS = 180;
const RISK_CACHE_TTL_MS = 60 * 60 * 1000;

type StageMetrics = {
  days: WeatherDay[];
  precipTotal: number;
  precipAvg: number;
  tempMax: number;
  tempMin: number;
  tempAvg: number;
  humidityAvg?: number;
  windMax?: number;
};

type StageEvaluation = {
  stage: CropStageRule;
  metrics: StageMetrics;
  categories: RiskCategoryResult[];
  score: number;
};

function levelFromScore(score: number): RiskLevel {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError('Datas devem estar no formato YYYY-MM-DD.', 400);
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (Number.isNaN(date.getTime())) {
    throw new AppError('Datas do plano são inválidas.', 400);
  }

  return date;
}

function diffDaysInclusive(start: Date, end: Date) {
  return Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
}

function getStageAllocations(totalDays: number, stages: CropStageRule[]) {
  if (totalDays <= 0) {
    return stages.map((stage) => ({ stage, days: 0 }));
  }

  if (totalDays <= stages.length) {
    return stages.map((stage, index) => ({
      stage,
      days: index < totalDays ? 1 : 0,
    }));
  }

  const allocations = stages.map((stage) => {
    const exact = stage.durationShare * totalDays;
    const base = Math.max(1, Math.floor(exact));
    return {
      stage,
      days: base,
      remainder: exact - Math.floor(exact),
    };
  });

  let assigned = allocations.reduce((sum, item) => sum + item.days, 0);

  if (assigned > totalDays) {
    allocations.sort((a, b) => a.remainder - b.remainder);
    let index = 0;
    while (assigned > totalDays && index < allocations.length) {
      if (allocations[index].days > 1) {
        allocations[index].days -= 1;
        assigned -= 1;
      } else {
        index += 1;
      }
    }
  } else if (assigned < totalDays) {
    allocations.sort((a, b) => b.remainder - a.remainder);
    let index = 0;
    while (assigned < totalDays) {
      allocations[index % allocations.length].days += 1;
      assigned += 1;
      index += 1;
    }
  }

  return allocations;
}

function sliceDaysByStages(days: WeatherDay[], stages: CropStageRule[]) {
  const allocations = getStageAllocations(days.length, stages);
  const slices: { stage: CropStageRule; days: WeatherDay[] }[] = [];
  let cursor = 0;

  allocations.forEach((allocation) => {
    if (allocation.days <= 0) {
      return;
    }

    const slice = days.slice(cursor, cursor + allocation.days);
    slices.push({ stage: allocation.stage, days: slice });
    cursor += allocation.days;
  });

  return slices;
}

function computeStageMetrics(days: WeatherDay[]): StageMetrics {
  const precipTotal = days.reduce((sum, day) => sum + day.precipitationSum, 0);
  const tempMax = Math.max(...days.map((day) => day.temperatureMax));
  const tempMin = Math.min(...days.map((day) => day.temperatureMin));
  const tempAvg = average(days.map((day) => (day.temperatureMax + day.temperatureMin) / 2));
  const humidityValues = days.map((day) => day.humidityMean).filter((value): value is number => value !== undefined);
  const windValues = days.map((day) => day.windSpeedMax).filter((value): value is number => value !== undefined);

  return {
    days,
    precipTotal,
    precipAvg: precipTotal / Math.max(days.length, 1),
    tempMax,
    tempMin,
    tempAvg,
    humidityAvg: humidityValues.length ? average(humidityValues) : undefined,
    windMax: windValues.length ? Math.max(...windValues) : undefined,
  };
}

function buildCategory(
  id: RiskCategoryId,
  label: string,
  score: number,
  reasons: string[],
  recommendations: string[]
): RiskCategoryResult {
  return {
    id,
    label,
    score: Number(score.toFixed(1)),
    level: levelFromScore(score),
    reasons,
    recommendations,
  };
}

function evaluateWaterStress(stage: CropStageRule, metrics: StageMetrics, field: Field): RiskCategoryResult {
  const minPrecip = stage.thresholds.precipMinPerDay * metrics.days.length;
  let score = 0;
  const reasons: string[] = [];
  const recommendations: string[] = [];

  if (metrics.precipTotal < minPrecip) {
    score = ((minPrecip - metrics.precipTotal) / minPrecip) * 100;
    reasons.push('Chuvas abaixo do mínimo recomendado para o período, com risco de seca.');
    recommendations.push('Avalie irrigação suplementar e monitoramento de umidade do solo.');
  }

  if (field.soilTexture === 'arenoso') {
    score += 10;
    if (score > 0) {
      reasons.push('Solo arenoso tende a reter menos água.');
    }
  }

  if (field.irrigation) {
    score -= 25;
    if (score > 0) {
      recommendations.push('Use a irrigação para reduzir estresse hídrico.');
    }
  }

  return buildCategory('water_stress', 'Estresse hídrico', clamp(score), reasons, recommendations);
}

function evaluateWaterExcess(stage: CropStageRule, metrics: StageMetrics, field: Field): RiskCategoryResult {
  const maxPrecip = stage.thresholds.precipMaxPerDay * metrics.days.length;
  let score = 0;
  const reasons: string[] = [];
  const recommendations: string[] = [];

  if (metrics.precipTotal > maxPrecip) {
    score = ((metrics.precipTotal - maxPrecip) / maxPrecip) * 100;
    reasons.push('Volume de chuva acima do limite recomendado para a fase, com risco de encharcamento.');
    recommendations.push('Reforce práticas de drenagem e evite tráfego em solo encharcado.');
  }

  if (field.drainage === 'ruim') {
    score += 20;
    if (score > 0) {
      reasons.push('Drenagem do solo classificada como ruim.');
    }
  }

  if (field.soilTexture === 'argiloso') {
    score += 10;
    if (score > 0) {
      reasons.push('Solo argiloso tende a reter mais água.');
    }
  }

  return buildCategory('water_excess', 'Excesso hídrico', clamp(score), reasons, recommendations);
}

function evaluateHeat(stage: CropStageRule, metrics: StageMetrics): RiskCategoryResult {
  const { tempMaxIdeal, tempMaxCritical } = stage.thresholds;
  let score = 0;
  const reasons: string[] = [];
  const recommendations: string[] = [];

  if (metrics.tempMax > tempMaxIdeal) {
    if (metrics.tempMax <= tempMaxCritical) {
      score = ((metrics.tempMax - tempMaxIdeal) / (tempMaxCritical - tempMaxIdeal)) * 60;
    } else {
      score = 80 + (metrics.tempMax - tempMaxCritical) * 5;
    }
    reasons.push('Temperaturas máximas acima do ideal para a fase.');
    recommendations.push('Planeje manejo para reduzir estresse térmico (sombreamento, irrigação).');
  }

  return buildCategory('heat_stress', 'Calor excessivo', clamp(score), reasons, recommendations);
}

function evaluateCold(stage: CropStageRule, metrics: StageMetrics): RiskCategoryResult {
  const { tempMinIdeal, tempMinCritical } = stage.thresholds;
  let score = 0;
  const reasons: string[] = [];
  const recommendations: string[] = [];

  if (metrics.tempMin < tempMinIdeal) {
    if (metrics.tempMin >= tempMinCritical) {
      score = ((tempMinIdeal - metrics.tempMin) / (tempMinIdeal - tempMinCritical)) * 60;
    } else {
      score = 80 + (tempMinCritical - metrics.tempMin) * 5;
    }
    reasons.push('Temperaturas mínimas abaixo do ideal para a fase.');
    recommendations.push('Avalie proteção contra frio ou ajuste de calendário.');
  }

  return buildCategory('cold_stress', 'Frio excessivo', clamp(score), reasons, recommendations);
}

function evaluateWind(stage: CropStageRule, metrics: StageMetrics): RiskCategoryResult {
  const windMaxLimit = stage.thresholds.windMax;
  let score = 0;
  const reasons: string[] = [];
  const recommendations: string[] = [];

  if (windMaxLimit && metrics.windMax && metrics.windMax > windMaxLimit) {
    score = ((metrics.windMax - windMaxLimit) / windMaxLimit) * 100;
    reasons.push('Velocidade do vento acima do ideal no período.');
    recommendations.push('Considere barreiras ou manejo para reduzir danos por vento.');
  }

  return buildCategory('wind_risk', 'Risco de vento', clamp(score), reasons, recommendations);
}

function evaluatePestDisease(stage: CropStageRule, metrics: StageMetrics): RiskCategoryResult {
  const { pestTempMin, pestTempMax, pestHumidityMin } = stage.thresholds;
  let score = 0;
  const reasons: string[] = [];
  const recommendations: string[] = [];

  if (
    metrics.humidityAvg !== undefined &&
    pestTempMin !== undefined &&
    pestTempMax !== undefined &&
    pestHumidityMin !== undefined
  ) {
    const tempInRange = metrics.tempAvg >= pestTempMin && metrics.tempAvg <= pestTempMax;
    const humidityHigh = metrics.humidityAvg >= pestHumidityMin;

    if (tempInRange && humidityHigh) {
      score = 50 + (metrics.humidityAvg - pestHumidityMin) * 1.5 + metrics.precipAvg * 1.2;
      reasons.push('Condições de temperatura e umidade favorecem risco potencial de pragas/doenças.');
      recommendations.push('Reforce monitoramento fitossanitário e inspeções frequentes.');
    }
  }

  return buildCategory('pest_disease', 'Risco potencial de pragas/doenças', clamp(score), reasons, recommendations);
}

function evaluateSoilSuitability(field: Field, crop: CropProfile): RiskCategoryResult {
  let score = 0;
  const reasons: string[] = [];
  const recommendations: string[] = [];

  if (!field.soilTexture && !field.drainage && field.irrigation === undefined) {
    recommendations.push('Informe textura do solo, drenagem e irrigação para melhorar a análise.');
    return buildCategory('soil_suitability', 'Adequação do solo', 0, reasons, recommendations);
  }

  if (field.soilTexture && !crop.soil.textures.includes(field.soilTexture)) {
    score += 50;
    reasons.push('Textura do solo fora da recomendação principal para a cultura.');
    recommendations.push('Considere ajustes de manejo ou seleção de cultivar mais adaptada.');
  }

  if (field.drainage && !crop.soil.drainage.includes(field.drainage)) {
    score += 35;
    reasons.push('Nível de drenagem do solo não é o ideal para a cultura.');
    recommendations.push('Avalie melhorias de drenagem ou práticas de conservação.');
  }

  if (crop.soil.irrigationRecommended && field.irrigation === false) {
    score += 20;
    reasons.push('A cultura se beneficia de irrigação e o talhão não possui irrigação.');
    recommendations.push('Avalie viabilidade de irrigação suplementar.');
  }

  return buildCategory('soil_suitability', 'Adequação do solo', clamp(score), reasons, recommendations);
}

function aggregateStageScore(stage: StageEvaluation) {
  const scores = stage.categories.map((category) => category.score);
  return average(scores);
}

function mergeCategories(stageEvaluations: StageEvaluation[]) {
  const merged = new Map<RiskCategoryId, RiskCategoryResult>();

  stageEvaluations.forEach((evaluation) => {
    evaluation.categories.forEach((category) => {
      const existing = merged.get(category.id);
      if (!existing || category.score > existing.score) {
        merged.set(category.id, category);
      }
    });
  });

  return Array.from(merged.values());
}

function buildPlanDates(start: Date, totalDays: number) {
  return Array.from({ length: totalDays }, (_, index) => formatDate(addDays(start, index)));
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

export async function getPlanRisk(
  userId: string,
  farmId: string,
  fieldId: string,
  planId: string
): Promise<PlanRiskAssessment> {
  const plan = await planService.getById(userId, farmId, fieldId, planId);
  const crop = cropService.getCropById(plan.cropId);

  if (!crop) {
    throw new AppError('Cultura do plano não encontrada.', 404);
  }

  const startDate = parseDate(plan.startDate);
  const endDate = parseDate(plan.endDate);
  const totalDays = diffDaysInclusive(startDate, endDate);

  if (totalDays > MAX_PLAN_DAYS) {
    throw new AppError(`O planejamento informado ultrapassa o limite de ${MAX_PLAN_DAYS} dias.`, 400);
  }

  const forecast = await weatherService.getForecast(userId, farmId, fieldId, { days: MAX_FORECAST_DAYS });
  const field = await fieldService.getById(userId, farmId, fieldId);

  if (
    plan.riskCache &&
    plan.riskCache.assessment.startDate === plan.startDate &&
    plan.riskCache.assessment.endDate === plan.endDate &&
    new Date(plan.riskCache.expiresAt).getTime() > Date.now() &&
    new Date(plan.riskCache.assessment.generatedAt).getTime() >= new Date(field.updatedAt).getTime()
  ) {
    return plan.riskCache.assessment;
  }
  const planDates = buildPlanDates(startDate, totalDays);
  const forecastByDate = new Map(forecast.days.map((day) => [day.date, day]));
  const forecastCoverage = planDates.filter((date) => forecastByDate.has(date)).length;

  let historicalSeries: WeatherDay[] = [];
  if (forecastCoverage < totalDays) {
    historicalSeries = await historicalWeatherService.getHistoricalNormals(
      field.centroidLat,
      field.centroidLon,
      startDate,
      totalDays
    );
  }

  const combinedDays = planDates.map((date, index) => {
    const forecastDay = forecastByDate.get(date);
    if (forecastDay) {
      return forecastDay;
    }

    const historicalDay = historicalSeries[index];
    if (!historicalDay) {
      throw new AppError('Dados climáticos insuficientes para o período selecionado.', 400);
    }

    return historicalDay;
  });

  const stageSlices = sliceDaysByStages(combinedDays, crop.stages);

  const finalStageEvaluations = stageSlices.map((slice) => {
    const metrics = computeStageMetrics(slice.days);
    const categories = [
      evaluateWaterStress(slice.stage, metrics, field),
      evaluateWaterExcess(slice.stage, metrics, field),
      evaluateHeat(slice.stage, metrics),
      evaluateCold(slice.stage, metrics),
      evaluateWind(slice.stage, metrics),
      evaluatePestDisease(slice.stage, metrics),
    ];
    const score = aggregateStageScore({ stage: slice.stage, metrics, categories, score: 0 });
    return {
      stage: slice.stage,
      metrics,
      categories,
      score,
    };
  });

  const stageScoreSum = finalStageEvaluations.reduce((sum, stage) => sum + stage.score * stage.stage.weight, 0);
  const stageWeightSum = finalStageEvaluations.reduce((sum, stage) => sum + stage.stage.weight, 0) || 1;
  let overallScore = stageScoreSum / stageWeightSum;

  const soilCategory = evaluateSoilSuitability(field, crop);
  if (soilCategory.score > 0) {
    overallScore = overallScore * 0.85 + soilCategory.score * 0.15;
  }

  overallScore = clamp(overallScore);

  const categories = mergeCategories(finalStageEvaluations);
  categories.push(soilCategory);

  const mode = forecastCoverage === totalDays ? 'forecast' : forecastCoverage === 0 ? 'historical' : 'mixed';
  const confidence = mode === 'forecast' ? 'high' : mode === 'mixed' ? 'medium' : 'low';
  const notes: string[] = [];

  if (mode === 'forecast') {
    notes.push(`Análise baseada em previsão meteorológica de curto prazo (até ${MAX_FORECAST_DAYS} dias).`);
  } else if (mode === 'mixed') {
    notes.push(
      `Parte do período usa climatologia histórica, não previsão diária. Previsão direta disponível apenas para os próximos ${MAX_FORECAST_DAYS} dias.`
    );
  } else {
    notes.push(
      'Análise baseada em climatologia histórica, com menor confiabilidade para o dia a dia.'
    );
  }

  const assessment: PlanRiskAssessment = {
    planId: plan.id,
    fieldId: plan.fieldId,
    cropId: crop.id,
    cropName: crop.name,
    startDate: plan.startDate,
    endDate: plan.endDate,
    riskLevel: levelFromScore(overallScore),
    score: Number(overallScore.toFixed(1)),
    categories,
    mode,
    confidence,
    notes,
    generatedAt: new Date().toISOString(),
  };

  await planService.updateRiskCache(userId, farmId, fieldId, plan.id, {
    assessment,
    expiresAt: new Date(Date.now() + RISK_CACHE_TTL_MS).toISOString(),
  });

  return assessment;
}
