import { AppError } from '../utils/AppError';
import type {
  CropProfile,
  CropStageRule,
  Field,
  PlanRiskAssessment,
  YieldForecast,
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
import { logger } from '../utils/logger';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_FORECAST_DAYS = 16;
const MAX_PLAN_DAYS = 180;
const RISK_CACHE_TTL_MS = 60 * 60 * 1000;
const ASSESSMENT_VERSION = 'milho-zarc-v6';
const RAINY_DAY_THRESHOLD_MM = 3;
const HARVEST_WINDOW_MIN_TOTAL_RAIN_MM = 25;

type StageMetrics = {
  days: WeatherDay[];
  precipTotal: number;
  precipAvg: number;
  tempMax: number;
  tempMin: number;
  tempMinAvg: number;
  tempAvg: number;
  rainyDays: number;
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

function computeAttentionScore(value: number, start: number, end: number, maxScore = 25) {
  if (value <= start) return maxScore;
  if (value >= end) return 0;
  return ((end - value) / Math.max(end - start, 0.0001)) * maxScore;
}

function computeAttentionScoreFromRatio(ratio: number, startRatio: number, maxScore = 25) {
  if (ratio < startRatio) return 0;
  if (ratio >= 1) return maxScore;
  return ((ratio - startRatio) / Math.max(1 - startRatio, 0.0001)) * maxScore;
}

function standardDeviation(values: number[]) {
  if (values.length === 0) return 0;
  const avg = average(values);
  const variance = average(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
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

function getReferenceStageDurations(stages: CropStageRule[], cycleDays: number) {
  const allocations = stages.map((stage, index) => {
    const exact = stage.durationShare * cycleDays;
    const base = Math.max(1, Math.floor(exact));
    return {
      index,
      stage,
      days: base,
      remainder: exact - Math.floor(exact),
    };
  });

  let assigned = allocations.reduce((sum, item) => sum + item.days, 0);

  if (assigned > cycleDays) {
    allocations.sort((a, b) => a.remainder - b.remainder);
    let index = 0;
    while (assigned > cycleDays && index < allocations.length) {
      if (allocations[index].days > 1) {
        allocations[index].days -= 1;
        assigned -= 1;
      } else {
        index += 1;
      }
    }
  } else if (assigned < cycleDays) {
    allocations.sort((a, b) => b.remainder - a.remainder);
    let index = 0;
    while (assigned < cycleDays) {
      allocations[index % allocations.length].days += 1;
      assigned += 1;
      index += 1;
    }
  }

  allocations.sort((a, b) => a.index - b.index);

  return allocations.map(({ stage, days }) => ({ stage, days }));
}

function getStageAllocations(totalDays: number, stages: CropStageRule[], cycleDays?: number) {
  if (totalDays <= 0) {
    return stages.map((stage) => ({ stage, days: 0 }));
  }

  const referenceCycleDays = cycleDays && cycleDays > 0 ? cycleDays : totalDays;
  const allocations = getReferenceStageDurations(stages, referenceCycleDays);
  let remainingDays = totalDays;

  const sequentialAllocations = allocations.map((allocation) => {
    if (remainingDays <= 0) {
      return { stage: allocation.stage, days: 0 };
    }

    const days = Math.min(allocation.days, remainingDays);
    remainingDays -= days;
    return {
      stage: allocation.stage,
      days,
    };
  });

  if (remainingDays > 0 && sequentialAllocations.length > 0) {
    sequentialAllocations[sequentialAllocations.length - 1].days += remainingDays;
  }

  return sequentialAllocations;
}

function sliceDaysByStages(days: WeatherDay[], stages: CropStageRule[], cycleDays?: number) {
  const allocations = getStageAllocations(days.length, stages, cycleDays);
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
  const tempMinAvg = average(days.map((day) => day.temperatureMin));
  const tempAvg = average(days.map((day) => (day.temperatureMax + day.temperatureMin) / 2));
  const rainyDays = days.filter((day) => day.precipitationSum > 0).length;
  const humidityValues = days.map((day) => day.humidityMean).filter((value): value is number => value !== undefined);
  const windValues = days.map((day) => day.windSpeedMax).filter((value): value is number => value !== undefined);

  return {
    days,
    precipTotal,
    precipAvg: precipTotal / Math.max(days.length, 1),
    tempMax,
    tempMin,
    tempMinAvg,
    tempAvg,
    rainyDays,
    humidityAvg: humidityValues.length ? average(humidityValues) : undefined,
    windMax: windValues.length ? Math.max(...windValues) : undefined,
  };
}

function buildCategory(
  id: RiskCategoryId,
  label: string,
  score: number,
  acceptableRange: string | undefined,
  observedRange: string | undefined,
  rangeInterpretation: string | undefined,
  reasons: string[],
  recommendations: string[]
): RiskCategoryResult {
  return {
    id,
    label,
    score: Number(score.toFixed(1)),
    level: levelFromScore(score),
    acceptableRange,
    observedRange,
    rangeInterpretation,
    reasons,
    recommendations,
  };
}

function computeYieldForecast({
  crop,
  planArea,
  categories,
  overallScore,
  mode,
  combinedDays,
}: {
  crop: CropProfile;
  planArea: number | null;
  categories: RiskCategoryResult[];
  overallScore: number;
  mode: 'forecast' | 'mixed' | 'historical';
  combinedDays: WeatherDay[];
}): YieldForecast | null {
  if (!crop.yieldModel) {
    return null;
  }

  const { baselineYield, minYield, maxYield, sensitivity, riskWeights } = crop.yieldModel;
  const weightSum = categories.reduce((sum, category) => sum + (riskWeights[category.id] ?? 0), 0);
  const weightedImpact = categories.reduce(
    (sum, category) => sum + (riskWeights[category.id] ?? 0) * (category.score / 100),
    0
  );

  const normalizedImpact = weightSum > 0 ? weightedImpact / weightSum : overallScore / 100;
  const yieldFactor = clamp(1 - normalizedImpact * sensitivity, 0.2, 1.2);
  const estimatedYieldRaw = baselineYield * yieldFactor;
  const estimatedYield = clamp(estimatedYieldRaw, 0, maxYield);

  const tempAvg = average(combinedDays.map((day) => (day.temperatureMax + day.temperatureMin) / 2));
  const precipAvg = average(combinedDays.map((day) => day.precipitationSum));
  const variability = standardDeviation(combinedDays.map((day) => day.precipitationSum));

  const baseSpread = mode === 'forecast' ? 0.1 : mode === 'mixed' ? 0.2 : 0.3;
  const variabilitySpread = clamp(variability / Math.max(precipAvg, 1) * 0.05, 0, 0.1);
  const spread = baseSpread + variabilitySpread;

  const min = clamp(estimatedYield * (1 - spread), 0, maxYield);
  const max = clamp(Math.max(estimatedYield, estimatedYield * (1 + spread)), 0, maxYield);

  const totalProduction = planArea ? Number((estimatedYield * planArea).toFixed(2)) : null;

  const factors = categories
    .map((category) => {
      const weight = riskWeights[category.id] ?? 0;
      const impact = weightSum > 0 ? (weight * (category.score / 100)) / weightSum : 0;
      return {
        id: category.id,
        label: category.label,
        impact: Number((impact * 100).toFixed(1)),
      };
    })
    .filter((factor) => factor.impact > 0)
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3);

  const notes = [
    'Estimativa calculada por modelo agroclimático parametrizado para milho 1ª safra.',
    'Base de produtividade ajustada pela série histórica da Conab para a cultura.',
    `Média térmica do período: ${tempAvg.toFixed(1)}°C; precipitação média diária: ${precipAvg.toFixed(1)} mm.`,
    mode === 'forecast'
      ? 'Baseada em previsão meteorológica de curto prazo.'
      : mode === 'mixed'
      ? 'Parte do período utiliza climatologia histórica.'
      : 'Baseada exclusivamente em climatologia histórica.',
  ];

  return {
    model: 'milho-zarc-v2',
    unit: 't/ha',
    baselineYield: Number(baselineYield.toFixed(2)),
    estimatedYield: Number(estimatedYield.toFixed(2)),
    minYield: Number(min.toFixed(2)),
    maxYield: Number(max.toFixed(2)),
    totalProduction,
    confidence: mode === 'forecast' ? 'high' : mode === 'mixed' ? 'medium' : 'low',
    notes,
    factors,
  };
}

function evaluateWaterStress(
  crop: CropProfile,
  stage: CropStageRule,
  metrics: StageMetrics
): RiskCategoryResult | null {
  const precipMinPerDay = stage.thresholds.precipMinPerDay;

  if (precipMinPerDay === undefined) {
    return null;
  }

  const cycleModel = crop.cycleModel;
  const baseTemp = cycleModel?.baseTempC ?? stage.thresholds.tempAvgMinCritical ?? 10;
  const referenceTemp = cycleModel?.referenceTempC ?? stage.thresholds.tempAvgMaxIdeal ?? 22.5;
  const thermalDemandFactor = clamp(
    (metrics.tempAvg - baseTemp) / Math.max(referenceTemp - baseTemp, 1),
    0.55,
    1.05
  );
  const adjustedPrecipMinPerDay = precipMinPerDay * thermalDemandFactor;
  const minPrecip = adjustedPrecipMinPerDay * metrics.days.length;
  const acceptableRange = `Chuva acumulada: mínimo de ${minPrecip.toFixed(1)} mm`;
  const observedRange = `Chuva acumulada: ${metrics.precipTotal.toFixed(1)} mm`;

  let score = 0;
  const reasons: string[] = [];
  const recommendations: string[] = [];
  let rangeInterpretation = 'Dentro da faixa aceitável, com margem confortável.';

  if (metrics.precipTotal < minPrecip) {
    score = ((minPrecip - metrics.precipTotal) / minPrecip) * 100;
    rangeInterpretation = 'Fora da faixa aceitável.';
    reasons.push(
      'Chuva acumulada abaixo da necessidade hídrica ajustada à fase do milho e à temperatura média observada.'
    );
    recommendations.push('Reavalie a janela de semeadura e acompanhe a umidade do solo durante a fase crítica.');
  } else if (metrics.precipTotal < minPrecip * 1.15) {
    score = computeAttentionScore(metrics.precipTotal, minPrecip, minPrecip * 1.15, 25);
    rangeInterpretation = 'Dentro da faixa aceitável, mas próximo do limite técnico.';
    reasons.push('A chuva ficou próxima do mínimo recomendado para a fase.');
    recommendations.push('Monitore a umidade do solo, pois a fase está com pouca margem hídrica.');
  }

  return buildCategory(
    'water_stress',
    'Estresse hídrico',
    clamp(score),
    acceptableRange,
    observedRange,
    rangeInterpretation,
    reasons,
    recommendations
  );
}

function evaluateWaterExcess(stage: CropStageRule, metrics: StageMetrics): RiskCategoryResult | null {
  const rainyDaysMax = stage.thresholds.rainyDaysMax;

  if (rainyDaysMax === undefined) {
    return null;
  }

  const finalWindow = metrics.days.slice(-Math.min(metrics.days.length, 10));
  const rainyDays = finalWindow.filter((day) => day.precipitationSum >= RAINY_DAY_THRESHOLD_MM).length;
  const finalWindowPrecipTotal = finalWindow.reduce((sum, day) => sum + day.precipitationSum, 0);
  const acceptableRange = `Dias com chuva >= ${RAINY_DAY_THRESHOLD_MM} mm: de 0 a ${rainyDaysMax} e \nAcumulado no decêndio final: de 0 a ${(HARVEST_WINDOW_MIN_TOTAL_RAIN_MM - 0.1).toFixed(1)} mm`;
  const observedRange = `Dias com chuva >= ${RAINY_DAY_THRESHOLD_MM} mm: ${rainyDays}\nAcumulado no decêndio final: ${finalWindowPrecipTotal.toFixed(1)} mm`;
  let score = 0;
  const reasons: string[] = [];
  const recommendations: string[] = [];
  let rangeInterpretation = 'Dentro da faixa aceitável, com margem confortável.';

  if (rainyDays > rainyDaysMax && finalWindowPrecipTotal >= HARVEST_WINDOW_MIN_TOTAL_RAIN_MM) {
    score = ((rainyDays - rainyDaysMax) / Math.max(10 - rainyDaysMax, 1)) * 100;
    rangeInterpretation = 'Fora da faixa aceitável.';
    reasons.push(
      'O decêndio final concentra dias de chuva operacionalmente relevantes acima do limite usado para a colheita.'
    );
    recommendations.push('Revise a janela de colheita e evite operações com chuva persistente no talhão.');
  } else {
    const rainyDayRatio = rainyDaysMax > 0 ? rainyDays / rainyDaysMax : 0;
    const rainRatio = finalWindowPrecipTotal / HARVEST_WINDOW_MIN_TOTAL_RAIN_MM;
    const maxRatio = Math.max(rainyDayRatio, rainRatio);

    if (maxRatio >= 0.8) {
      score = computeAttentionScoreFromRatio(maxRatio, 0.8, 25);
      rangeInterpretation = 'Dentro da faixa aceitável, mas próximo do limite técnico.';
      reasons.push('O decêndio final ficou próximo do critério de excesso de chuva usado para colheita.');
      recommendations.push('Acompanhe a previsão próxima da colheita para evitar operações com pouca janela seca.');
    }
  }

  return buildCategory(
    'water_excess',
    'Excesso de chuva na colheita',
    clamp(score),
    acceptableRange,
    observedRange,
    rangeInterpretation,
    reasons,
    recommendations
  );
}

function evaluateHeat(stage: CropStageRule, metrics: StageMetrics): RiskCategoryResult | null {
  const { tempAvgMaxIdeal, tempAvgMaxCritical, tempMaxCritical } = stage.thresholds;

  if (tempAvgMaxIdeal === undefined) {
    return null;
  }

  const acceptableRange = [
    tempAvgMaxIdeal !== undefined ? `Temperatura média: até ${tempAvgMaxIdeal.toFixed(1)} °C` : null,
    tempMaxCritical !== undefined ? `Pico máximo: até ${tempMaxCritical.toFixed(1)} °C` : null,
  ]
    .filter(Boolean)
    .join('\n');
  const observedRange = `Temperatura média: ${metrics.tempAvg.toFixed(1)} °C\nPico máximo: ${metrics.tempMax.toFixed(1)} °C`;

  let score = 0;
  const reasons: string[] = [];
  const recommendations: string[] = [];
  let rangeInterpretation = 'Dentro da faixa aceitável, com margem confortável.';

  if (metrics.tempAvg > tempAvgMaxIdeal) {
    if (tempAvgMaxCritical !== undefined && metrics.tempAvg <= tempAvgMaxCritical) {
      score = ((metrics.tempAvg - tempAvgMaxIdeal) / (tempAvgMaxCritical - tempAvgMaxIdeal)) * 70;
    } else {
      score = 80;
    }
    rangeInterpretation = 'Fora da faixa aceitável.';
    reasons.push('A faixa térmica da fase reprodutiva ficou acima do limite indicado para o milho.');
  }

  if (tempMaxCritical !== undefined && metrics.tempMax > tempMaxCritical) {
    score = Math.max(score, 85 + (metrics.tempMax - tempMaxCritical) * 3);
    rangeInterpretation = 'Fora da faixa aceitável.';
    reasons.push('Picos de calor podem comprometer a polinização e o enchimento de grãos.');
  }

  if (score === 0) {
    const attentionScores: number[] = [];

    if (tempAvgMaxCritical !== undefined) {
      const attentionStartAvg = tempAvgMaxIdeal - Math.max((tempAvgMaxCritical - tempAvgMaxIdeal) * 0.25, 1);
      if (metrics.tempAvg >= attentionStartAvg && metrics.tempAvg <= tempAvgMaxIdeal) {
        attentionScores.push(computeAttentionScore(metrics.tempAvg, attentionStartAvg, tempAvgMaxIdeal, 25));
      }
    }

    if (tempMaxCritical !== undefined) {
      const attentionStartMax = tempMaxCritical - 2;
      if (metrics.tempMax >= attentionStartMax && metrics.tempMax <= tempMaxCritical) {
        attentionScores.push(computeAttentionScore(metrics.tempMax, attentionStartMax, tempMaxCritical, 25));
      }
    }

    score = attentionScores.length > 0 ? Math.max(...attentionScores) : 0;

    if (score > 0) {
      rangeInterpretation = 'Dentro da faixa aceitável, mas próximo do limite técnico.';
      reasons.push('O pico térmico ficou próximo do limite crítico da fase reprodutiva.');
      recommendations.push('Monitore a evolução térmica da fase reprodutiva para evitar exposição adicional ao calor.');
    }
  }

  if (score > 0) {
    if (rangeInterpretation === 'Fora da faixa aceitável.') {
      recommendations.push('Reveja a data de semeadura para reduzir exposição do florescimento ao calor.');
    }
  }

  return buildCategory(
    'heat_stress',
    'Calor na fase reprodutiva',
    clamp(score),
    acceptableRange,
    observedRange,
    rangeInterpretation,
    reasons,
    recommendations
  );
}

function evaluateCold(stage: CropStageRule, metrics: StageMetrics): RiskCategoryResult {
  const { tempAvgMinIdeal, tempAvgMinCritical, tempMinIdeal, tempMinCritical } = stage.thresholds;
  const acceptableRange = [
    tempAvgMinIdeal !== undefined ? `Temperatura média: acima de ${tempAvgMinIdeal.toFixed(1)} °C` : null,
    tempMinIdeal !== undefined ? `Temperatura mínima média: acima de ${tempMinIdeal.toFixed(1)} °C` : null,
  ]
    .filter(Boolean)
    .join('\n');
  const observedRange = `Temperatura média: ${metrics.tempAvg.toFixed(1)} °C\nTemperatura mínima média: ${metrics.tempMinAvg.toFixed(1)} °C`;
  let score = 0;
  const reasons: string[] = [];
  const recommendations: string[] = [];
  let rangeInterpretation = 'Dentro da faixa aceitável, com margem confortável.';

  if (tempAvgMinIdeal !== undefined && metrics.tempAvg < tempAvgMinIdeal) {
    if (tempAvgMinCritical !== undefined && metrics.tempAvg >= tempAvgMinCritical) {
      score = ((tempAvgMinIdeal - metrics.tempAvg) / (tempAvgMinIdeal - tempAvgMinCritical)) * 60;
    } else {
      score = 75;
    }
    rangeInterpretation = 'Fora da faixa aceitável.';
    reasons.push('A temperatura média do período ficou abaixo do patamar térmico indicado para o milho.');
  }

  if (tempMinIdeal !== undefined && metrics.tempMinAvg < tempMinIdeal) {
    if (tempMinCritical !== undefined && metrics.tempMinAvg > tempMinCritical) {
      score = Math.max(score, ((tempMinIdeal - metrics.tempMinAvg) / (tempMinIdeal - tempMinCritical)) * 75);
    } else {
      score = Math.max(score, 90);
    }
    rangeInterpretation = 'Fora da faixa aceitável.';
    reasons.push('Temperaturas mínimas elevam o risco térmico do ciclo e aproximam a lavoura de condição de geada.');
  }

  if (score === 0) {
    const attentionScores: number[] = [];

    if (tempAvgMinIdeal !== undefined && metrics.tempAvg > tempAvgMinIdeal && metrics.tempAvg <= tempAvgMinIdeal + 1.5) {
      const attentionEndAvg = tempAvgMinIdeal + 1.5;
      attentionScores.push(((attentionEndAvg - metrics.tempAvg) / 1.5) * 20);
    }

    if (tempMinIdeal !== undefined && metrics.tempMinAvg > tempMinIdeal && metrics.tempMinAvg <= tempMinIdeal + 1.5) {
      const attentionEndMin = tempMinIdeal + 1.5;
      attentionScores.push(((attentionEndMin - metrics.tempMinAvg) / 1.5) * 25);
    }

    score = attentionScores.length > 0 ? Math.max(...attentionScores) : 0;

    if (score > 0) {
      rangeInterpretation = 'Dentro da faixa aceitável, mas próximo do limite técnico.';
      reasons.push('A temperatura ficou próxima do limite mínimo recomendado para a fase.');
      recommendations.push('Monitore a evolução térmica do ciclo para evitar avanço em período mais frio.');
    }
  }

  if (score > 0 && rangeInterpretation === 'Fora da faixa aceitável.') {
    recommendations.push('Reavalie a janela de semeadura para afastar o ciclo de períodos frios.');
  }

  return buildCategory(
    'cold_stress',
    'Frio e geada',
    clamp(score),
    acceptableRange,
    observedRange,
    rangeInterpretation,
    reasons,
    recommendations
  );
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

function computeCategoryWeightedScore(categories: RiskCategoryResult[], crop: CropProfile) {
  const activeCategories = categories.filter((category) => category.score > 0);

  if (activeCategories.length === 0) {
    return 0;
  }

  const riskWeights = crop.yieldModel?.riskWeights ?? {};
  let weightedSum = 0;
  let totalWeight = 0;

  activeCategories.forEach((category) => {
    const weight = riskWeights[category.id] ?? 1;
    weightedSum += category.score * weight;
    totalWeight += weight;
  });

  if (totalWeight === 0) {
    return average(activeCategories.map((category) => category.score));
  }

  return weightedSum / totalWeight;
}

function logAssessmentDebug({
  planId,
  farmId,
  startDate,
  endDate,
  planArea,
  field,
  crop,
  totalDays,
  forecastCoverage,
  mode,
  confidence,
  stageWeightedScore,
  categoryWeightedScore,
  overallScore,
  categories,
  stageEvaluations,
  yieldForecast,
  cycleEstimate,
}: {
  planId: string;
  farmId: string;
  startDate: string;
  endDate: string;
  planArea: number;
  field: Field;
  crop: CropProfile;
  totalDays: number;
  forecastCoverage: number;
  mode: 'forecast' | 'mixed' | 'historical';
  confidence: 'high' | 'medium' | 'low';
  stageWeightedScore: number;
  categoryWeightedScore: number;
  overallScore: number;
  categories: RiskCategoryResult[];
  stageEvaluations: StageEvaluation[];
  yieldForecast: YieldForecast | null;
  cycleEstimate: PlanRiskAssessment['cycleEstimate'];
}) {
  logger.info(`[PlanRiskDebug] ${planId}`, {
    planId,
    farmId,
    startDate,
    endDate,
    planArea,
    fieldId: field.id,
    fieldName: field.name,
    cropId: crop.id,
    cropName: crop.name,
    assessmentVersion: ASSESSMENT_VERSION,
    totalDays,
    forecastCoverage,
    historicalCoverage: totalDays - forecastCoverage,
    mode,
    confidence,
    coordinates: {
      lat: field.centroidLat,
      lon: field.centroidLon,
    },
    scoreBreakdown: {
      stageWeightedScore: Number(stageWeightedScore.toFixed(1)),
      categoryWeightedScore: Number(categoryWeightedScore.toFixed(1)),
      overallScore: Number(overallScore.toFixed(1)),
    },
    cycleEstimate,
    categories: categories.map((category) => ({
      id: category.id,
      label: category.label,
      level: category.level,
      score: category.score,
      reasons: category.reasons,
    })),
    stages: stageEvaluations.map((evaluation) => ({
      id: evaluation.stage.id,
      name: evaluation.stage.name,
      weight: evaluation.stage.weight,
      durationShare: evaluation.stage.durationShare,
      metrics: {
        days: evaluation.metrics.days.length,
        precipTotal: Number(evaluation.metrics.precipTotal.toFixed(2)),
        precipAvg: Number(evaluation.metrics.precipAvg.toFixed(2)),
        tempAvg: Number(evaluation.metrics.tempAvg.toFixed(2)),
        tempMinAvg: Number(evaluation.metrics.tempMinAvg.toFixed(2)),
        tempMax: Number(evaluation.metrics.tempMax.toFixed(2)),
        rainyDays: evaluation.metrics.rainyDays,
      },
      categories: evaluation.categories.map((category) => ({
        id: category.id,
        score: category.score,
        level: category.level,
      })),
      stageScore: Number(evaluation.score.toFixed(1)),
    })),
    yieldForecast: yieldForecast
      ? {
          model: yieldForecast.model,
          baselineYield: yieldForecast.baselineYield,
          estimatedYield: yieldForecast.estimatedYield,
          minYield: yieldForecast.minYield,
          maxYield: yieldForecast.maxYield,
          totalProduction: yieldForecast.totalProduction,
          confidence: yieldForecast.confidence,
          factors: yieldForecast.factors,
        }
      : null,
  });
}

function buildPlanDates(start: Date, totalDays: number) {
  return Array.from({ length: totalDays }, (_, index) => formatDate(addDays(start, index)));
}

function formatDate(date: Date) {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
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

  if (field.centroidLat === null || field.centroidLon === null) {
    throw new AppError('Talhão sem delimitação. Defina o polígono antes de consultar o risco.', 400);
  }

  if (
    plan.riskCache &&
    plan.riskCache.assessment.assessmentVersion === ASSESSMENT_VERSION &&
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

  const stageSlices = sliceDaysByStages(combinedDays, crop.stages, crop.cycleDays);

  const finalStageEvaluations = stageSlices.map((slice) => {
    const metrics = computeStageMetrics(slice.days);
    const categories = [
      evaluateWaterStress(crop, slice.stage, metrics),
      evaluateWaterExcess(slice.stage, metrics),
      evaluateHeat(slice.stage, metrics),
      evaluateCold(slice.stage, metrics),
    ].filter((category): category is RiskCategoryResult => category !== null);
    const score = aggregateStageScore({ stage: slice.stage, metrics, categories, score: 0 });
    return {
      stage: slice.stage,
      metrics,
      categories,
      score,
    };
  });

  const categories = mergeCategories(finalStageEvaluations);
  const stageScoreSum = finalStageEvaluations.reduce((sum, stage) => sum + stage.score * stage.stage.weight, 0);
  const stageWeightSum = finalStageEvaluations.reduce((sum, stage) => sum + stage.stage.weight, 0) || 1;
  const stageWeightedScore = stageScoreSum / stageWeightSum;
  const categoryWeightedScore = computeCategoryWeightedScore(categories, crop);
  const overallScore = clamp(Math.max(stageWeightedScore, categoryWeightedScore));

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

  if (plan.cycleEstimate) {
    notes.push(
      `Data final estimada para ${formatDate(parseDate(plan.cycleEstimate.endDate))} com ciclo projetado de ${plan.cycleEstimate.estimatedCycleDays} dias, usando soma térmica simplificada e cobertura ${plan.cycleEstimate.dataMode}.`
    );
  }

  const yieldForecast = computeYieldForecast({
    crop,
    planArea: plan.areaHa ?? null,
    categories,
    overallScore,
    mode,
    combinedDays,
  });

  logAssessmentDebug({
    planId: plan.id,
    farmId,
    startDate: plan.startDate,
    endDate: plan.endDate,
    planArea: plan.areaHa,
    field,
    crop,
    totalDays,
    forecastCoverage,
    mode,
    confidence,
    stageWeightedScore,
    categoryWeightedScore,
    overallScore,
    categories,
    stageEvaluations: finalStageEvaluations,
    yieldForecast,
    cycleEstimate: plan.cycleEstimate,
  });

  const assessment: PlanRiskAssessment = {
    planId: plan.id,
    fieldId: plan.fieldId,
    cropId: crop.id,
    cropName: crop.name,
    assessmentVersion: ASSESSMENT_VERSION,
    startDate: plan.startDate,
    endDate: plan.endDate,
    cycleEstimate: plan.cycleEstimate,
    riskLevel: levelFromScore(overallScore),
    score: Number(overallScore.toFixed(1)),
    categories,
    mode,
    confidence,
    notes,
    yieldForecast: yieldForecast ?? undefined,
    generatedAt: new Date().toISOString(),
  };

  await planService.updateRiskCache(userId, farmId, fieldId, plan.id, {
    assessment,
    expiresAt: new Date(Date.now() + RISK_CACHE_TTL_MS).toISOString(),
  });

  return assessment;
}
