export type AlertSeverity = 'low' | 'medium' | 'high';

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  telefone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgriculturalProfile {
  userId: string;
  farmName: string;
  city: string;
  state: string;
  cropTypes: string[];
  areaHectares: number;
  createdAt: string;
  updatedAt: string;
}

export interface Farm {
  id: string;
  userId: string;
  name: string;
  city?: string;
  state?: string;
  createdAt: string;
  updatedAt: string;
}

export type SoilTexture = 'arenoso' | 'medio' | 'argiloso';
export type DrainageLevel = 'bom' | 'medio' | 'ruim';

export type FieldGeometry = {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
};

export interface Field {
  id: string;
  userId: string;
  farmId: string;
  name: string;
  geometry: FieldGeometry | null;
  areaHa: number | null;
  centroidLat: number | null;
  centroidLon: number | null;
  soilTexture?: SoilTexture;
  drainage?: DrainageLevel;
  irrigation?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CropStageRule {
  id: string;
  name: string;
  durationShare: number;
  weight: number;
  thresholds: {
    tempAvgMinIdeal?: number;
    tempAvgMaxIdeal?: number;
    tempAvgMinCritical?: number;
    tempAvgMaxCritical?: number;
    tempMinIdeal?: number;
    tempMaxIdeal?: number;
    tempMinCritical?: number;
    tempMaxCritical?: number;
    precipMinTotal?: number;
    precipMaxTotal?: number;
    precipMinPerDay?: number;
    precipMaxPerDay?: number;
    rainyDaysMax?: number;
    windMax?: number;
    humidityMin?: number;
    humidityMax?: number;
    pestTempMin?: number;
    pestTempMax?: number;
    pestHumidityMin?: number;
  };
}

export interface CropProfile {
  id: string;
  name: string;
  description: string;
  cycleDays?: number;
  cycleModel?: {
    method: 'thermal-time';
    baseTempC: number;
    referenceTempC: number;
    minCycleDays: number;
    maxCycleDays: number;
  };
  soil: {
    textures: SoilTexture[];
    drainage: DrainageLevel[];
    irrigationRecommended?: boolean;
  };
  stages: CropStageRule[];
  yieldModel?: {
    baselineYield: number;
    minYield: number;
    maxYield: number;
    sensitivity: number;
    riskWeights: Partial<Record<RiskCategoryId, number>>;
  };
}

export interface PlantingPlan {
  id: string;
  userId: string;
  farmId: string;
  fieldId: string;
  cropId: string;
  startDate: string;
  endDate: string;
  cycleEstimate?: PlanCycleEstimate;
  areaHa: number;
  createdAt: string;
  updatedAt: string;
  riskCache?: PlanRiskCache;
}

export interface PlanCycleEstimate {
  method: 'thermal-time';
  startDate: string;
  endDate: string;
  estimatedCycleDays: number;
  baseTempC: number;
  referenceTempC: number;
  targetDegreeDays: number;
  dataMode: 'forecast' | 'mixed' | 'historical';
  confidence: 'high' | 'medium' | 'low';
  forecastDaysUsed: number;
  historicalDaysUsed: number;
  notes: string[];
}

export type RiskCategoryId =
  | 'water_stress'
  | 'water_excess'
  | 'heat_stress'
  | 'cold_stress'
  | 'wind_risk'
  | 'pest_disease'
  | 'soil_suitability';

export interface RiskCategoryResult {
  id: RiskCategoryId;
  label: string;
  score: number;
  level: RiskLevel;
  reasons: string[];
  recommendations: string[];
}

export interface PlanRiskAssessment {
  planId: string;
  fieldId: string;
  cropId: string;
  cropName: string;
  assessmentVersion: string;
  startDate: string;
  endDate: string;
  cycleEstimate?: PlanCycleEstimate;
  riskLevel: RiskLevel;
  score: number;
  categories: RiskCategoryResult[];
  mode: 'forecast' | 'mixed' | 'historical';
  confidence: 'high' | 'medium' | 'low';
  notes: string[];
  yieldForecast?: YieldForecast;
  generatedAt: string;
}

export interface PlanRiskCache {
  assessment: PlanRiskAssessment;
  expiresAt: string;
}

export interface YieldForecast {
  model: string;
  unit: 't/ha';
  baselineYield: number;
  estimatedYield: number;
  minYield: number;
  maxYield: number;
  totalProduction: number | null;
  confidence: 'high' | 'medium' | 'low';
  notes: string[];
  factors: Array<{
    id: RiskCategoryId;
    label: string;
    impact: number;
  }>;
}

export interface WeatherDay {
  date: string;
  temperatureMin: number;
  temperatureMax: number;
  precipitationSum: number;
  windSpeedMax?: number;
  humidityMean?: number;
}

export interface WeatherSnapshot {
  id: string;
  userId: string;
  farmId: string;
  fieldId: string;
  source: string;
  fetchedAt: string;
  expiresAt: string;
  days: WeatherDay[];
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PredictionRisk {
  fieldId: string;
  riskLevel: RiskLevel;
  reasons: string[];
  recommendations: string[];
  generatedAt: string;
}

export interface DashboardTotals {
  farms: number;
  fields: number;
  areaHa: number;
}

export interface DashboardFieldSummary {
  fieldId: string;
  fieldName: string;
  farmId: string;
  farmName?: string;
  areaHa: number;
  lastSnapshotAt?: string;
}

export interface DashboardOverview {
  totals: DashboardTotals;
  alerts: AlertItem[];
  fields: DashboardFieldSummary[];
  updatedAt: string;
}
