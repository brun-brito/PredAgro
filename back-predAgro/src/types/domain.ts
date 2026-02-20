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

export type FieldGeometry = {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
};

export interface Field {
  id: string;
  userId: string;
  farmId: string;
  name: string;
  geometry: FieldGeometry;
  areaHa: number;
  centroidLat: number;
  centroidLon: number;
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
