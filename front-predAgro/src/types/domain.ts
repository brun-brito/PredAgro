export interface User {
  id: string;
  name: string;
  email: string;
  telefone?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends AuthCredentials {
  name: string;
  telefone: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AccountProfile {
  user: User;
  authProvider: string;
  emailEditable: boolean;
}

export interface UpdateProfilePayload {
  name: string;
  email: string;
  telefone: string;
}

export interface Farm {
  id: string;
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
  fieldId: string;
  farmId: string;
  source: string;
  fetchedAt: string;
  expiresAt: string;
  days: WeatherDay[];
}

export type AlertSeverity = 'low' | 'medium' | 'high';

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  createdAt: string;
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

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface CropStageRule {
  id: string;
  name: string;
  durationShare: number;
  weight: number;
}

export interface CropProfile {
  id: string;
  name: string;
  description: string;
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
  fieldId: string;
  farmId: string;
  cropId: string;
  startDate: string;
  endDate: string;
  areaHa: number;
  createdAt: string;
  updatedAt: string;
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
  startDate: string;
  endDate: string;
  riskLevel: RiskLevel;
  score: number;
  categories: RiskCategoryResult[];
  mode: 'forecast' | 'mixed' | 'historical';
  confidence: 'high' | 'medium' | 'low';
  notes: string[];
  yieldForecast?: YieldForecast;
  generatedAt: string;
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
